import { env } from "cloudflare:workers";
import { isSmsAdminRequest } from "@/lib/server/sms/admin-auth";
import { GATEWAY, TENANT, canReceivePromotionalMessage, maskPhone, noStore, normalizePhone } from "@/lib/server/sms/domain";
import {liveSmsEnabled,smsSimSelection} from "@/lib/server/sms/config";
import {smsKeyConfigured} from "@/lib/server/sms/admin-auth";

const db = () => (env as any).DB;
const str = (v: unknown, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";

export async function GET(request: Request) {
  if (!await isSmsAdminRequest(request)) return noStore({ ok: false }, 401);
  if (!db()) return noStore({ ok: false, error: "DB_UNAVAILABLE" }, 503);
  try {
    const [counts, contacts, messages, campaigns, agent, summary] = await Promise.all([
      db().prepare("SELECT status,COUNT(*) AS count FROM sms_messages WHERE tenant_id=? GROUP BY status").bind(TENANT).all(),
      db().prepare(`SELECT id,phone_e164,display_name,kind,source,created_at,
        CASE WHEN EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=sms_contacts.tenant_id AND o.contact_id=sms_contacts.id) THEN 'revoked'
        ELSE COALESCE((SELECT status FROM sms_consents s WHERE s.tenant_id=sms_contacts.tenant_id AND s.contact_id=sms_contacts.id ORDER BY s.created_at DESC,s.rowid DESC LIMIT 1),'none') END AS consent_status
        FROM sms_contacts WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100`).bind(TENANT).all(),
      db().prepare("SELECT m.id,m.category,m.status,m.body,m.created_at,m.updated_at,c.phone_e164 FROM sms_messages m JOIN sms_contacts c ON c.id=m.contact_id WHERE m.tenant_id=? ORDER BY m.created_at DESC LIMIT 100").bind(TENANT).all(),
      db().prepare("SELECT id,name,status,scheduled_at,max_recipients,created_at FROM sms_campaigns WHERE tenant_id=? ORDER BY created_at DESC LIMIT 50").bind(TENANT).all(),
      db().prepare("SELECT a.last_seen_at,a.last_error,a.enabled,g.enabled AS gateway_enabled,g.sim_number,g.inbound_enabled FROM sms_gateway_agents a JOIN sms_gateways g ON g.id=a.gateway_id WHERE a.id='khonenama-windows' AND a.tenant_id=?").bind(TENANT).first(),
      db().prepare(`SELECT
        (SELECT COUNT(*) FROM sms_campaigns WHERE tenant_id=? AND status IN ('approved','running')) AS active_campaigns,
        (SELECT COUNT(*) FROM sms_opt_outs WHERE tenant_id=?) AS opt_outs,
        (SELECT COUNT(*) FROM sms_messages WHERE tenant_id=? AND status='queued' AND priority>0) AS priority_queued,
        (SELECT COUNT(*) FROM sms_contacts c WHERE c.tenant_id=? AND NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=c.tenant_id AND o.contact_id=c.id)) AS consented_contacts`).bind(TENANT,TENANT,TENANT,TENANT).first(),
    ]);
    return noStore({ ok: true, counts: counts.results, contacts: contacts.results.map((c:any)=>({ ...c, phone_e164: maskPhone(c.phone_e164) })),
      messages: messages.results.map((m:any)=>({ ...m, phone_e164: maskPhone(m.phone_e164) })), campaigns: campaigns.results, agent:agent?{...agent,sim_selection:smsSimSelection(env as any)}:null,summary,
      liveSendingEnabled:liveSmsEnabled(env as any),setup:{separateKeyConfigured:smsKeyConfigured(),bridgeCredentialConfigured:Boolean((env as any).SMS_BRIDGE_TOKEN)} });
  } catch { return noStore({ ok: false, error: "SMS_SCHEMA_UNAVAILABLE" }, 503); }
}

export async function POST(request: Request) {
  if (!await isSmsAdminRequest(request)) return noStore({ ok: false }, 401);
  if (!db()) return noStore({ ok: false, error: "DB_UNAVAILABLE" }, 503);
  if (Number(request.headers.get("content-length") || 0) > 200_000) return noStore({ ok: false, error: "BODY_TOO_LARGE" }, 413);
  const input = await request.json().catch(()=>null);
  if (!input || typeof input !== "object") return noStore({ ok:false, error:"INVALID_JSON" },400);
  try {
    if (input.action === "editContact") {
      const id=str(input.id,64), name=str(input.name,120), kind=input.kind;
      if(!["customer","seller","admin","other"].includes(kind))return noStore({ok:false,error:"INVALID_CONTACT"},400);
      // Phone identity is immutable here: changing it must not carry old consent to a new recipient.
      const row=await db().prepare("UPDATE sms_contacts SET display_name=?,kind=? WHERE id=? AND tenant_id=? RETURNING id").bind(name,kind,id,TENANT).first();
      if(!row)return noStore({ok:false},404);
      await audit("contact_edited",id);
      return noStore({ok:true,id});
    }
    if (input.action === "contact") {
      const phone = normalizePhone(input.phone);
      if (!phone) return noStore({ ok:false, error:"INVALID_PHONE" },400);
      const id = crypto.randomUUID();
      await db().prepare("INSERT OR IGNORE INTO sms_contacts(id,tenant_id,phone_e164,display_name,kind,source) VALUES(?,?,?,?,?,?)")
        .bind(id,TENANT,phone,str(input.name,120),["customer","seller","admin","other"].includes(input.kind)?input.kind:"other","admin_manual").run();
      const row = await db().prepare("SELECT id FROM sms_contacts WHERE tenant_id=? AND phone_e164=?").bind(TENANT,phone).first();
      await audit("contact_upsert",row.id);
      return noStore({ok:true,id:row.id,duplicate:row.id!==id});
    }
    if (input.action === "consent") {
      const contactId = str(input.contactId,64);
      const contact = await db().prepare("SELECT id FROM sms_contacts WHERE id=? AND tenant_id=?").bind(contactId,TENANT).first();
      if (!contact || !["granted","revoked"].includes(input.status)) return noStore({ok:false,error:"INVALID_CONSENT"},400);
      const method = str(input.method,80), version = str(input.textVersion,80), evidence = str(input.evidenceRef,300);
      if (!method || !version || !evidence) return noStore({ok:false,error:"EVIDENCE_REQUIRED"},400);
      await db().prepare("INSERT INTO sms_consents(id,tenant_id,contact_id,status,method,text_version,evidence_ref) VALUES(?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),TENANT,contactId,input.status,method,version,evidence).run();
      if (input.status === "revoked") await db().prepare("INSERT OR IGNORE INTO sms_opt_outs(tenant_id,contact_id,source) VALUES(?,?,?)").bind(TENANT,contactId,"admin").run();
      if (input.status === "revoked") await db().prepare("UPDATE sms_messages SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND contact_id=? AND category='promotional' AND status='queued'").bind(TENANT,contactId).run();
      if (input.status === "granted") await db().prepare("DELETE FROM sms_opt_outs WHERE tenant_id=? AND contact_id=?").bind(TENANT,contactId).run();
      await audit("consent_"+input.status,contactId);
      return noStore({ok:true});
    }
    if (input.action === "queue") {
      if(typeof input.body!=="string"||input.body.length>1000)return noStore({ok:false,error:"INVALID_MESSAGE"},400);
      const contactId = str(input.contactId,64), body = str(input.body,1000), key = str(input.idempotencyKey,120);
      const category = input.category;
      const reason=str(input.reason,120);
      const expiry = str(input.expiresAt,40);
      if (!body || !key || (category==="transactional"&&!reason) || !["transactional","promotional"].includes(category) || !Number.isFinite(Date.parse(expiry)) || Date.parse(expiry)<=Date.now())
        return noStore({ok:false,error:"INVALID_MESSAGE"},400);
      const contact = await db().prepare("SELECT id FROM sms_contacts WHERE id=? AND tenant_id=?").bind(contactId,TENANT).first();
      if (!contact) return noStore({ok:false,error:"CONTACT_NOT_FOUND"},404);
      const state=liveSmsEnabled(env as any)&&input.draftOnly!==true?"queued":"draft";
      if (state==="queued" && category === "promotional" && !await canReceivePromotionalMessage(db(),contactId)) return noStore({ok:false,error:"RECIPIENT_OPTED_OUT"},403);
      const prior=await db().prepare("SELECT id,contact_id,category,body FROM sms_messages WHERE tenant_id=? AND idempotency_key=?").bind(TENANT,key).first();
      if(prior && (prior.contact_id!==contactId || prior.category!==category || prior.body!==body)) return noStore({ok:false,error:"IDEMPOTENCY_CONFLICT"},409);
      const id=crypto.randomUUID();
      await db().prepare(`INSERT OR IGNORE INTO sms_messages(id,tenant_id,contact_id,category,body,status,priority,idempotency_key,gateway_id,expires_at)
        VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id,TENANT,contactId,category,body,state,category==="transactional"?10:0,key,GATEWAY,expiry).run();
      const row=await db().prepare("SELECT id,status FROM sms_messages WHERE tenant_id=? AND idempotency_key=?").bind(TENANT,key).first();
      if(row.id===id) await db().prepare("INSERT INTO sms_message_events(tenant_id,message_id,state) VALUES(?,?,?)").bind(TENANT,id,state).run();
      await audit(row.status==="draft"?"message_draft_saved":"message_queued",row.id);
      if(row.id===id) await db().prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(?,'site_admin','manual_message_reason',?,?)").bind(TENANT,id,reason||"promotional").run();
      return noStore({ok:true,id:row.id,status:row.status});
    }
    if (input.action === "cancel") {
      const id=str(input.id,64);
      const changed=await db().prepare("UPDATE sms_messages SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status IN ('draft','queued') RETURNING id").bind(id,TENANT).first();
      if (!changed) return noStore({ok:false,error:"CANNOT_CANCEL"},409);
      await db().prepare("INSERT INTO sms_message_events(tenant_id,message_id,state) VALUES(?,?,'cancelled')").bind(TENANT,id).run();
      await audit("message_cancelled",id);
      return noStore({ok:true});
    }
    return noStore({ok:false,error:"UNKNOWN_ACTION"},400);
  } catch { return noStore({ok:false,error:"SMS_OPERATION_FAILED"},503); }
}

async function audit(action:string,targetId:string) {
  await db().prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin',?,?)").bind(TENANT,action,targetId).run();
}
