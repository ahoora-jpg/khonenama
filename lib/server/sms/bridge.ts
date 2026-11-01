import { ensureDispatchSchema } from './dispatch-control';
import { env } from "cloudflare:workers";
import { GATEWAY, TENANT, canTransition, gatewayState, isOptOut, noStore, normalizePhone, type SmsState } from "./domain";
import { CLAIM_SQL } from "./queue";
import {liveSmsEnabled,smsSimSelection} from "./config";
import {campaignRecipientAllowed} from './acquisition';

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
}
export async function authenticateAgent(request: Request): Promise<boolean> {
  const secret = String((env as any).SMS_BRIDGE_TOKEN || "");
  const header = request.headers.get("authorization") || "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const [a,b] = await Promise.all([digest(secret),digest(header.slice(7))]);
  let difference=0; for(let i=0;i<a.length;i++) difference |= a[i]^b[i];
  return difference===0;
}

export async function handleBridge(request: Request): Promise<Response> {
  if (!await authenticateAgent(request)) return noStore({ok:false},401);
  const db=(env as any).DB;
  if (!db) return noStore({ok:false,error:"DB_UNAVAILABLE"},503);
  const input=await request.json().catch(()=>null);
  if (!input || typeof input!=="object") return noStore({ok:false,error:"INVALID_JSON"},400);
  const agent=await db.prepare("SELECT a.enabled,g.enabled AS gateway_enabled,g.sim_number FROM sms_gateway_agents a JOIN sms_gateways g ON g.id=a.gateway_id WHERE a.id='khonenama-windows' AND a.tenant_id=? AND g.id=?")
    .bind(TENANT,GATEWAY).first();
  const selectedSim=smsSimSelection(env as any);
  if (!agent?.enabled || !agent?.gateway_enabled || agent.sim_number!==2 || selectedSim===null) return noStore({ok:false,error:"BRIDGE_DISABLED"},403);
  if (input.action==="heartbeat") {
    await db.prepare("UPDATE sms_gateway_agents SET last_seen_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id='khonenama-windows' AND tenant_id=?").bind(TENANT).run();
    return noStore({ok:true});
  }
  if(input.action==="inboxSenders"){
    const rows=await db.prepare(`SELECT DISTINCT c.phone_e164 FROM sms_contacts c JOIN sms_messages m ON m.contact_id=c.id
      WHERE c.tenant_id=? AND m.tenant_id=? AND m.status IN ('submitted','processed','sent','delivered','unknown')
        AND m.created_at>datetime('now','-90 days') LIMIT 500`).bind(TENANT,TENANT).all();
    return noStore({ok:true,phones:(rows.results||[]).map((r:any)=>r.phone_e164)});
  }
  if(input.action==="inboxHealthy"){
    await db.prepare("UPDATE sms_gateway_agents SET last_inbox_at=CURRENT_TIMESTAMP WHERE id='khonenama-windows' AND tenant_id=?").bind(TENANT).run();
    return noStore({ok:true});
  }
  if (input.action==="claim") {
    await ensureDispatchSchema(db);
    if((input.simNumber??2)!==selectedSim)return noStore({ok:false,error:"SIM_SELECTION_MISMATCH"},409);
    if(!liveSmsEnabled(env as any))return noStore({ok:false,error:"LIVE_SEND_DISABLED"},403);
    const id=crypto.randomUUID(), token=crypto.randomUUID();
    const rawInterval=Number((env as any).SMS_MIN_INTERVAL_SECONDS||15);
    const interval=Number.isFinite(rawInterval)?Math.max(15,Math.min(3600,Math.round(rawInterval))):15;
    // The update, including the promotional opt-out re-check, is one SQLite statement.
    const row=await db.prepare(CLAIM_SQL)
      .bind(token,TENANT,GATEWAY,`-${interval} seconds`).first();
    if (!row) return noStore({ok:true,job:null});
    const contact=await db.prepare("SELECT phone_e164 FROM sms_contacts WHERE id=? AND tenant_id=?").bind(row.contact_id,TENANT).first();
    await db.prepare("INSERT INTO sms_message_events(tenant_id,message_id,state,detail) VALUES(?,?,'leased',?)").bind(TENANT,row.id,id).run();
    return noStore({ok:true,job:{id:row.id,phone:contact.phone_e164,body:row.body,expiresAt:row.expires_at,leaseToken:row.lease_token,gatewayId:row.id,simNumber:selectedSim}});
  }
  if(input.action==="authorize"){
    if(!liveSmsEnabled(env as any))return noStore({ok:false,error:"LIVE_SEND_DISABLED"},403);
    const id=typeof input.messageId==="string"?input.messageId:"";
    const token=typeof input.leaseToken==="string"?input.leaseToken:"";
    const permitted=await db.prepare(`SELECT 1 AS allowed FROM sms_messages m WHERE m.id=? AND m.tenant_id=?
      AND m.lease_token=? AND m.status='leased' AND m.lease_until>CURRENT_TIMESTAMP
      AND m.body NOT LIKE '%{{%' AND EXISTS(SELECT 1 FROM sms_contacts c WHERE c.id=m.contact_id AND c.tenant_id=m.tenant_id AND c.source<>'removed')
      AND julianday(m.expires_at)>julianday('now')
      AND (m.campaign_id IS NULL OR EXISTS(SELECT 1 FROM sms_campaigns c WHERE c.id=m.campaign_id AND c.status IN ('running','completed')))
      AND (m.category='transactional' OR (
        EXISTS(SELECT 1 FROM sms_gateways g WHERE g.id=m.gateway_id AND g.inbound_enabled=1)
        AND
        NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=m.tenant_id AND o.contact_id=m.contact_id)
        AND EXISTS(SELECT 1 FROM sms_gateway_agents a WHERE a.gateway_id=m.gateway_id AND a.last_inbox_at>=datetime('now','-5 minutes'))
      ))`).bind(id,TENANT,token).first();
    return noStore({ok:true,allowed:Boolean(permitted)&&await campaignRecipientAllowed(db,id)});
  }
  if (input.action==="reconcile") {
    const row=await db.prepare(`UPDATE sms_messages SET updated_at=CURRENT_TIMESTAMP WHERE id=(
      SELECT id FROM sms_messages WHERE tenant_id=? AND gateway_id=?
        AND status IN ('unknown','submitted','processed','sent') AND gateway_message_id IS NOT NULL
        AND updated_at<datetime('now','-1 minute') ORDER BY updated_at LIMIT 1
      ) RETURNING id,gateway_message_id,lease_token`).bind(TENANT,GATEWAY).first();
    return noStore({ok:true,job:row?{id:row.id,gatewayId:row.gateway_message_id,leaseToken:row.lease_token}:null});
  }
  if (input.action==="report") {
    const messageId=typeof input.messageId==="string"?input.messageId:"";
    const leaseToken=typeof input.leaseToken==="string"?input.leaseToken:"";
    const gatewayId=typeof input.gatewayMessageId==="string"?input.gatewayMessageId.slice(0,120):"";
    const proposed=input.uncertain===true?"unknown":gatewayState(input.gatewayState);
    if (!messageId || !leaseToken || !proposed || !gatewayId) return noStore({ok:false,error:"INVALID_REPORT"},400);
    const current=await db.prepare("SELECT status,gateway_message_id,lease_token FROM sms_messages WHERE id=? AND tenant_id=?").bind(messageId,TENANT).first();
    if (!current || current.lease_token!==leaseToken || (current.gateway_message_id && current.gateway_message_id!==gatewayId)) return noStore({ok:false,error:"REPORT_CONFLICT"},409);
    if (current.status!==proposed && !canTransition(current.status as SmsState,proposed)) return noStore({ok:false,error:"INVALID_TRANSITION"},409);
    await db.batch([
      db.prepare("UPDATE sms_messages SET status=?,gateway_message_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status=? AND lease_token=?").bind(proposed,gatewayId,messageId,TENANT,current.status,leaseToken),
      db.prepare("INSERT INTO sms_message_events(tenant_id,message_id,state,detail) SELECT tenant_id,id,?,'gateway_report' FROM sms_messages WHERE id=? AND tenant_id=? AND lease_token=? AND status=? AND NOT EXISTS(SELECT 1 FROM sms_message_events e WHERE e.message_id=sms_messages.id AND e.state=? AND e.detail='gateway_report')").bind(proposed,messageId,TENANT,leaseToken,proposed,proposed),
      db.prepare("INSERT OR IGNORE INTO sms_delivery_attempts(tenant_id,message_id,attempt,gateway_message_id,result) SELECT tenant_id,id,attempts,?,? FROM sms_messages WHERE id=? AND tenant_id=? AND lease_token=? AND status=?").bind(gatewayId,proposed,messageId,TENANT,leaseToken,proposed),
    ]);
    const final=await db.prepare("SELECT status FROM sms_messages WHERE id=? AND tenant_id=?").bind(messageId,TENANT).first();
    if(final?.status!==proposed)return noStore({ok:false,error:"RACE_CONFLICT"},409);
    return noStore({ok:true,status:proposed});
  }
  if (input.action==="inbound") {
    const sender=normalizePhone(input.sender), body=typeof input.body==="string"?input.body.slice(0,1000):"";
    const receivedAt=typeof input.receivedAt==="string"?input.receivedAt:"";
    const id=typeof input.id==="string"?input.id.slice(0,120):"";
    if(!sender || !body || !id || !Number.isFinite(Date.parse(receivedAt))) return noStore({ok:false,error:"INVALID_INBOUND"},400);
    const contact=await db.prepare(`SELECT c.id FROM sms_contacts c WHERE c.tenant_id=? AND c.phone_e164=?
      AND EXISTS(SELECT 1 FROM sms_messages m WHERE m.tenant_id=c.tenant_id AND m.contact_id=c.id AND m.status IN ('submitted','processed','sent','delivered','unknown'))`)
      .bind(TENANT,sender).first();
    if(!contact)return noStore({ok:true,ignored:true});
    const recordId=Array.from(await digest([TENANT,id,sender,body,receivedAt].join("|"))).map(v=>v.toString(16).padStart(2,"0")).join("");
    await db.prepare("INSERT OR IGNORE INTO sms_inbound_messages(id,tenant_id,gateway_inbound_id,sender_e164,body,received_at) VALUES(?,?,?,?,?,?)")
      .bind(recordId,TENANT,id,sender,body,receivedAt).run();
    if(isOptOut(body)) {
      await db.prepare("INSERT OR IGNORE INTO sms_opt_outs(tenant_id,contact_id,source) VALUES(?,?,?)").bind(TENANT,contact.id,"inbound_sms").run();
      await db.prepare("UPDATE sms_messages SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND contact_id=? AND category='promotional' AND status='queued'").bind(TENANT,contact.id).run();
    }
    return noStore({ok:true});
  }
  return noStore({ok:false,error:"UNKNOWN_ACTION"},400);
}
