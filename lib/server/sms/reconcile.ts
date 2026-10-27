import { TENANT } from "./domain";

export async function reconcileSms(db:any,options:{liveSendingEnabled:boolean}={liveSendingEnabled:false}):Promise<void> {
  // A claimed task may already have reached Android. Never requeue it automatically.
  const uncertain=await db.prepare(`UPDATE sms_messages SET status='unknown',updated_at=CURRENT_TIMESTAMP
    WHERE id IN (SELECT id FROM sms_messages WHERE tenant_id=? AND status='leased' AND lease_until<CURRENT_TIMESTAMP LIMIT 100)
      AND status='leased' RETURNING id`).bind(TENANT).all();
  for(const row of uncertain.results||[]) await db.prepare("INSERT INTO sms_message_events(tenant_id,message_id,state,detail) VALUES(?,?,'unknown','lease_expired')").bind(TENANT,row.id).run();
  const expired=await db.prepare(`UPDATE sms_messages SET status='failed',updated_at=CURRENT_TIMESTAMP
    WHERE id IN (SELECT id FROM sms_messages WHERE tenant_id=? AND status='queued' AND julianday(expires_at)<=julianday('now') LIMIT 100)
      AND status='queued' RETURNING id`).bind(TENANT).all();
  for(const row of expired.results||[]) await db.prepare("INSERT INTO sms_message_events(tenant_id,message_id,state,detail) VALUES(?,?,'failed','expired_before_submission')").bind(TENANT,row.id).run();
  // Retain operational metadata; erase sensitive payloads after 90 days.
  await db.prepare(`UPDATE sms_messages SET body='[حذف‌شده طبق سیاست نگهداری]'
    WHERE tenant_id=? AND created_at<datetime('now','-90 days')
      AND status IN ('draft','sent','delivered','failed','cancelled','unknown')
      AND body<>'[حذف‌شده طبق سیاست نگهداری]'`).bind(TENANT).run();
  await db.prepare(`DELETE FROM sms_inbound_messages WHERE tenant_id=? AND created_at<datetime('now','-90 days')`).bind(TENANT).run();
  if(!options.liveSendingEnabled)return;
  const campaigns=await db.prepare(`SELECT id,group_id,body,max_recipients FROM sms_campaigns
    WHERE tenant_id=? AND status IN ('approved','running') AND (scheduled_at IS NULL OR julianday(scheduled_at)<=julianday('now'))
      AND EXISTS(SELECT 1 FROM sms_gateways g JOIN sms_gateway_agents a ON a.gateway_id=g.id
        WHERE g.id='khonenama-android' AND g.enabled=1 AND g.inbound_enabled=1 AND a.enabled=1 AND a.last_inbox_at>=datetime('now','-5 minutes'))
    LIMIT 3`).bind(TENANT).all();
  for(const campaign of campaigns.results||[]){
    await db.prepare("UPDATE sms_campaigns SET status='running' WHERE id=? AND tenant_id=? AND status='approved'").bind(campaign.id,TENANT).run();
    const countRow=await db.prepare("SELECT COUNT(*) AS count FROM sms_campaign_recipients WHERE campaign_id=?").bind(campaign.id).first();
    const remaining=Math.max(0,Math.min(20,campaign.max_recipients-Number(countRow?.count||0)));
    if(!remaining){
      await db.prepare(`UPDATE sms_campaigns SET status='completed' WHERE id=? AND status='running'
        AND NOT EXISTS(SELECT 1 FROM sms_messages WHERE campaign_id=? AND status IN ('queued','leased','submitted','processed','unknown'))`).bind(campaign.id,campaign.id).run();
      continue;
    }
    const contacts=await db.prepare(`SELECT c.id FROM sms_group_members gm JOIN sms_contacts c ON c.id=gm.contact_id
      WHERE gm.group_id=? AND c.tenant_id=?
        AND NOT EXISTS(SELECT 1 FROM sms_campaign_recipients cr WHERE cr.campaign_id=? AND cr.contact_id=c.id)
        AND NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=? AND o.contact_id=c.id)
      ORDER BY c.created_at,c.id LIMIT ?`).bind(campaign.group_id,TENANT,campaign.id,TENANT,remaining).all();
    if(!contacts.results?.length && Number(countRow?.count||0)===0){
      await db.prepare("UPDATE sms_campaigns SET status='paused' WHERE id=? AND tenant_id=? AND status='running'").bind(campaign.id,TENANT).run();
      await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(?,'system','campaign_empty_audience',?,'No eligible recipients; no messages queued')").bind(TENANT,campaign.id).run();
      continue;
    }
    for(const contact of contacts.results||[]){
      const id=crypto.randomUUID(),key=`campaign:${campaign.id}:${contact.id}`;
      await db.prepare(`INSERT OR IGNORE INTO sms_messages(id,tenant_id,contact_id,category,body,status,priority,idempotency_key,campaign_id,expires_at)
        VALUES(?,?,?,'promotional',?,'queued',0,?,?,datetime('now','+1 day'))`).bind(id,TENANT,contact.id,campaign.body,key,campaign.id).run();
      const message=await db.prepare("SELECT id FROM sms_messages WHERE tenant_id=? AND idempotency_key=?").bind(TENANT,key).first();
      await db.prepare("INSERT OR IGNORE INTO sms_campaign_recipients(campaign_id,contact_id,message_id) VALUES(?,?,?)").bind(campaign.id,contact.id,message.id).run();
    }
    if((contacts.results||[]).length<remaining) await db.prepare(`UPDATE sms_campaigns SET status='completed' WHERE id=? AND status='running'
      AND NOT EXISTS(SELECT 1 FROM sms_messages WHERE campaign_id=? AND status IN ('queued','leased','submitted','processed','unknown'))`).bind(campaign.id,campaign.id).run();
  }
}
