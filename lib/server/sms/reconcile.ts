import { ensureDispatchSchema } from './dispatch-control';
import { TENANT } from "./domain";
import {prepareRecipient} from './acquisition';

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
  await ensureDispatchSchema(db);
  if(await db.prepare('SELECT 1 FROM sms_dispatch_control WHERE tenant_id=? AND paused=1').bind(TENANT).first())return;
  const campaigns=await db.prepare(`SELECT id,group_id,body,max_recipients FROM sms_campaigns
    WHERE tenant_id=? AND NOT EXISTS(SELECT 1 FROM sms_dispatch_control control WHERE control.tenant_id=sms_campaigns.tenant_id AND control.paused=1) AND status IN ('approved','running') AND (scheduled_at IS NULL OR julianday(scheduled_at)<=julianday('now'))
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
        AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN users u ON REPLACE(REPLACE(u.phone,'+98','0'),' ','')=REPLACE(c.phone_e164,'+98','0') JOIN businesses b ON b.owner_user_id=u.id WHERE opt.campaign_id=? AND opt.exclude_booth_owners=1 AND b.status<>'suspended')
        AND NOT EXISTS(SELECT 1 FROM sms_campaign_options opt JOIN sms_messages prev ON prev.contact_id=c.id AND prev.tenant_id=c.tenant_id WHERE opt.campaign_id=? AND prev.campaign_id<>? AND prev.category='promotional' AND prev.attempts>0 AND prev.created_at>datetime('now','-'||opt.cooldown_days||' days'))
      ORDER BY c.created_at,c.id LIMIT ?`).bind(campaign.group_id,TENANT,campaign.id,TENANT,campaign.id,campaign.id,campaign.id,remaining).all();
    if(!contacts.results?.length && Number(countRow?.count||0)===0){
      await db.prepare("UPDATE sms_campaigns SET status='paused' WHERE id=? AND tenant_id=? AND status='running'").bind(campaign.id,TENANT).run();
      await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(?,'system','campaign_empty_audience',?,'No eligible recipients; no messages queued')").bind(TENANT,campaign.id).run();
      continue;
    }
    for(const contact of contacts.results||[]){
      const id=crypto.randomUUID(),key=`campaign:${campaign.id}:${contact.id}`;
      let prepared;try{prepared=await prepareRecipient(db,campaign,String(contact.id),id);}catch{await db.prepare("UPDATE sms_campaigns SET status='paused' WHERE id=?").bind(campaign.id).run();break;}
      await db.prepare(`INSERT OR IGNORE INTO sms_messages(id,tenant_id,contact_id,category,body,status,priority,idempotency_key,campaign_id,expires_at)
        SELECT ?,?,?,'promotional',?,'queued',0,?,?,datetime('now','+1 day') WHERE NOT EXISTS(SELECT 1 FROM sms_dispatch_control WHERE tenant_id=? AND paused=1) AND EXISTS(SELECT 1 FROM sms_campaigns WHERE id=? AND tenant_id=? AND status='running')`).bind(id,TENANT,contact.id,prepared.text,key,campaign.id,TENANT,campaign.id,TENANT).run();
      const message=await db.prepare("SELECT id FROM sms_messages WHERE tenant_id=? AND idempotency_key=?").bind(TENANT,key).first();
      if(!message)continue;
      await db.prepare("INSERT INTO sms_message_events(tenant_id,message_id,state) SELECT ?,?,'queued' WHERE NOT EXISTS(SELECT 1 FROM sms_message_events WHERE tenant_id=? AND message_id=? AND state='queued')").bind(TENANT,message.id,TENANT,message.id).run();
      await db.prepare('INSERT OR IGNORE INTO sms_message_costs(message_id,parts,tariff,estimated_cost) VALUES(?,?,?,?)').bind(message.id,prepared.parts,prepared.tariff,prepared.tariff===null?null:prepared.parts*prepared.tariff).run();
      await db.prepare("INSERT OR IGNORE INTO sms_campaign_recipients(campaign_id,contact_id,message_id) VALUES(?,?,?)").bind(campaign.id,contact.id,message.id).run();
    }
    if((contacts.results||[]).length<remaining) await db.prepare(`UPDATE sms_campaigns SET status='completed' WHERE id=? AND status='running'
      AND NOT EXISTS(SELECT 1 FROM sms_messages WHERE campaign_id=? AND status IN ('queued','leased','submitted','processed','unknown'))`).bind(campaign.id,campaign.id).run();
  }
}
