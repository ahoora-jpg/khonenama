import { TENANT } from './domain';
import { ensureDispatchSchema } from './dispatch-control';

// The same predicate is used for preview and atomic insertion. No consent gate is added.
export const RETRY_ELIGIBLE = `m.tenant_id=? AND m.status='failed' AND m.body<>'' AND m.body NOT LIKE '%{{%'
 AND m.body<>'[حذف‌شده طبق سیاست نگهداری]'
 AND EXISTS(SELECT 1 FROM sms_contacts c WHERE c.id=m.contact_id AND c.tenant_id=m.tenant_id AND c.source<>'removed')
 AND NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=m.tenant_id AND o.contact_id=m.contact_id)
 AND NOT EXISTS(SELECT 1 FROM sms_removed_records r WHERE r.tenant_id=m.tenant_id AND r.kind='campaign' AND r.record_id=m.campaign_id)
 AND (m.campaign_id IS NULL OR EXISTS(SELECT 1 FROM sms_campaigns campaign WHERE campaign.id=m.campaign_id AND campaign.tenant_id=m.tenant_id AND campaign.status<>'cancelled'))
 AND NOT EXISTS(SELECT 1 FROM sms_retry_receipts r WHERE r.tenant_id=m.tenant_id AND r.original_id=m.id)
 AND NOT EXISTS(SELECT 1 FROM sms_messages next WHERE next.tenant_id=m.tenant_id AND next.contact_id=m.contact_id
   AND next.id<>m.id AND next.body=m.body AND next.status IN('queued','leased','submitted','processed','sent','delivered','unknown'))
 AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN sms_contacts c ON c.id=m.contact_id
   JOIN users u ON REPLACE(REPLACE(u.phone,'+98','0'),' ','')=REPLACE(c.phone_e164,'+98','0')
   JOIN businesses b ON b.owner_user_id=u.id WHERE opt.campaign_id=m.campaign_id AND opt.exclude_booth_owners=1 AND b.status<>'suspended')
 AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN sms_messages prev ON prev.contact_id=m.contact_id AND prev.tenant_id=m.tenant_id
   WHERE opt.campaign_id=m.campaign_id AND prev.campaign_id<>m.campaign_id AND prev.category='promotional' AND prev.attempts>0
   AND julianday(prev.created_at)>julianday('now','-'||opt.cooldown_days||' days'))
 AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt WHERE opt.campaign_id=m.campaign_id AND opt.tracking_enabled=1
   AND NOT EXISTS(SELECT 1 FROM sms_recipient_links l WHERE l.campaign_id=m.campaign_id AND l.contact_id=m.contact_id AND l.tenant_id=m.tenant_id
     AND l.active=1 AND (l.expires_at IS NULL OR julianday(l.expires_at)>julianday(?))))`;

async function digest(value: unknown) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)))), b => b.toString(16).padStart(2, '0')).join('');
}
export async function previewRetry(db: any, ids: string[], scheduledAt: string) {
  await ensureDispatchSchema(db);
  const items = [];
  for (const id of ids) {
    const row = await db.prepare(`SELECT m.id,m.contact_id,m.campaign_id,m.body,m.updated_at FROM sms_messages m WHERE ${RETRY_ELIGIBLE} AND m.id=?`).bind(TENANT, scheduledAt, id).first();
    if (row) items.push(row);
  }
  return { ids: items.map(r => r.id), eligible: items.length, skipped: ids.length - items.length,
    token: await digest({ ids, scheduledAt, items }) };
}
export async function commitRetry(db: any, ids: string[], scheduledAt: string, token: string) {
  const preview = await previewRetry(db, ids, scheduledAt);
  // Previously committed retries are returned on a network retry, even if eligibility has changed.
  const existing = (await db.prepare(`SELECT original_id,retry_id FROM sms_retry_receipts WHERE tenant_id=? AND original_id IN (${ids.map(() => '?').join(',')})`).bind(TENANT, ...ids).all()).results;
  if (existing.length === ids.length) return { created: 0, existing: existing.length };
  if (preview.token !== token) throw Error('RETRY_PREVIEW_CHANGED');
  let created = 0;
  for (const originalId of preview.ids) {
    const id = 'retry_' + (await digest([TENANT, originalId])).slice(0, 48);
    const expiry = new Date(Date.parse(scheduledAt) + 86400000).toISOString();
    const statements = [
      db.prepare(`INSERT OR IGNORE INTO sms_messages(id,tenant_id,contact_id,category,body,status,priority,idempotency_key,source_event,campaign_id,gateway_id,scheduled_at,expires_at)
        SELECT ?,m.tenant_id,m.contact_id,m.category,m.body,'queued',m.priority,?,'admin_failed_retry',m.campaign_id,m.gateway_id,?,? FROM sms_messages m WHERE ${RETRY_ELIGIBLE} AND m.id=?`)
        .bind(id, id, scheduledAt, expiry, TENANT, scheduledAt, originalId),
      db.prepare(`INSERT OR IGNORE INTO sms_retry_receipts(tenant_id,original_id,retry_id) SELECT tenant_id,?,id FROM sms_messages WHERE id=? AND tenant_id=?`).bind(originalId, id, TENANT),
      db.prepare(`INSERT INTO sms_message_events(tenant_id,message_id,state,detail) SELECT tenant_id,id,'queued','retry:'||? FROM sms_messages WHERE id=? AND tenant_id=? AND NOT EXISTS(SELECT 1 FROM sms_message_events WHERE tenant_id=? AND message_id=? AND state='queued')`).bind(originalId, id, TENANT, TENANT, id),
      db.prepare(`INSERT OR IGNORE INTO sms_message_costs(message_id,parts,tariff,estimated_cost) SELECT ?,parts,tariff,estimated_cost FROM sms_message_costs WHERE message_id=? AND EXISTS(SELECT 1 FROM sms_messages WHERE id=? AND tenant_id=?)`).bind(id, originalId, id, TENANT),
      db.prepare(`INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) SELECT tenant_id,'site_admin','failed_retry',id,? FROM sms_messages WHERE id=? AND tenant_id=? AND NOT EXISTS(SELECT 1 FROM sms_audit_logs WHERE tenant_id=? AND action='failed_retry' AND target_id=?)`).bind(originalId, id, TENANT, TENANT, id),
    ];
    const result = await db.batch(statements);
    created += Number(result[0].meta?.changes || 0);
  }
  return { created, existing: existing.length };
}
