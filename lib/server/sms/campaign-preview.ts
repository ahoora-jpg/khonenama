import { TENANT } from './domain';
import { estimateSms } from '../../sms-text';
import { renderCampaignMessage } from './acquisition';

/** A read-only preview: never creates links, recipients or queue entries. */
export async function campaignStartPreview(db: any, id: string) {
  const c = await db.prepare(`SELECT c.*,o.tracking_enabled,o.variant_b,o.tariff FROM sms_campaigns c LEFT JOIN sms_campaign_options o ON o.campaign_id=c.id WHERE c.id=? AND c.tenant_id=?`).bind(id, TENANT).first();
  if (!c) return null;
  const queued = await db.prepare(`SELECT m.body FROM sms_messages m JOIN sms_contacts co ON co.id=m.contact_id AND co.tenant_id=m.tenant_id
    WHERE m.tenant_id=? AND m.campaign_id=? AND m.status='queued' AND julianday(m.expires_at)>julianday('now') AND co.source<>'removed'
    AND NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=co.tenant_id AND o.contact_id=co.id)
    AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN users u ON REPLACE(REPLACE(u.phone,'+98','0'),' ','')=REPLACE(co.phone_e164,'+98','0') JOIN businesses b ON b.owner_user_id=u.id WHERE opt.campaign_id=m.campaign_id AND opt.exclude_booth_owners=1 AND b.status<>'suspended')
    AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN sms_messages prev ON prev.contact_id=co.id AND prev.tenant_id=co.tenant_id WHERE opt.campaign_id=m.campaign_id AND prev.campaign_id<>m.campaign_id AND prev.category='promotional' AND prev.attempts>0 AND julianday(prev.created_at)>julianday('now','-'||opt.cooldown_days||' days'))`).bind(TENANT, id).all();
  const registered = await db.prepare('SELECT COUNT(*) n FROM sms_campaign_recipients WHERE campaign_id=?').bind(id).first();
  const limit = Math.max(0, c.max_recipients - registered.n);
  const rows = limit ? await db.prepare(`SELECT co.display_name,co.id FROM sms_group_members gm JOIN sms_contacts co ON co.id=gm.contact_id AND co.tenant_id=gm.tenant_id
    WHERE gm.tenant_id=? AND gm.group_id=? AND co.source<>'removed'
      AND NOT EXISTS(SELECT 1 FROM sms_campaign_recipients cr WHERE cr.campaign_id=? AND cr.contact_id=co.id)
      AND NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=co.tenant_id AND o.contact_id=co.id)
      AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN users u ON REPLACE(REPLACE(u.phone,'+98','0'),' ','')=REPLACE(co.phone_e164,'+98','0') JOIN businesses b ON b.owner_user_id=u.id WHERE opt.campaign_id=? AND opt.exclude_booth_owners=1 AND b.status<>'suspended')
      AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN sms_messages prev ON prev.contact_id=co.id AND prev.tenant_id=co.tenant_id WHERE opt.campaign_id=? AND prev.campaign_id<>? AND prev.category='promotional' AND prev.attempts>0 AND julianday(prev.created_at)>julianday('now','-'||opt.cooldown_days||' days'))
    ORDER BY co.created_at,co.id LIMIT ?`).bind(TENANT, c.group_id, id, id, id, id, limit).all() : { results: [] };
  let parts = queued.results.reduce((sum: number, r: any) => sum + estimateSms(r.body).parts, 0);
  for (const contact of rows.results) {
    // Future A/B assignment is random. Report an honest upper bound without creating links.
    const variants = c.tracking_enabled && c.variant_b ? [c.body,c.variant_b] : [c.body];
    parts += Math.max(...variants.map(text=>estimateSms(renderCampaignMessage(text,c.tracking_enabled?'a'.repeat(40):undefined,contact.display_name)).parts));
  }
  return { name: c.name, eligible: rows.results.length + queued.results.length, parts, scheduledAt: c.scheduled_at, cost: c.tariff == null ? null : parts * c.tariff };
}
