import {GATEWAY,TENANT,normalizePhone} from "./domain";

export async function queueTransactionalEvent(db:any,input:{code:string;eventId:string;phone:string;variables:Record<string,string>}){
  const phone=normalizePhone(input.phone);
  if(!phone || !/^[a-z0-9_]{2,60}$/.test(input.code) || !/^[a-zA-Z0-9:_-]{2,120}$/.test(input.eventId)) return false;
  const gateway=await db.prepare("SELECT enabled FROM sms_gateways WHERE id=? AND tenant_id=?").bind(GATEWAY,TENANT).first();
  if(!gateway?.enabled)return false;
  const template=await db.prepare("SELECT body FROM sms_templates WHERE tenant_id=? AND code=? AND category='transactional' AND enabled=1")
    .bind(TENANT,input.code).first();
  if(!template)return false;
  const allowed=new Set(Object.keys(input.variables));
  let invalid=false;
  const message=String(template.body).replace(/\{\{([a-zA-Z0-9_]+)\}\}/g,(_match:string,key:string)=>{
    if(!allowed.has(key)){invalid=true;return "";}
    return String(input.variables[key]||"").slice(0,120);
  });
  if(invalid || !message.trim() || message.length>1000)return false;
  const contactId=crypto.randomUUID();
  await db.prepare("INSERT OR IGNORE INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES(?,?,?,'site_event')")
    .bind(contactId,TENANT,phone).run();
  const contact=await db.prepare("SELECT id FROM sms_contacts WHERE tenant_id=? AND phone_e164=?").bind(TENANT,phone).first();
  const id=crypto.randomUUID();
  const inserted=await db.prepare(`INSERT OR IGNORE INTO sms_messages(id,tenant_id,contact_id,category,body,status,priority,idempotency_key,source_event,gateway_id,expires_at)
    VALUES(?,?,?,'transactional',?,'queued',10,?,?,?,datetime('now','+1 day'))`)
    .bind(id,TENANT,contact.id,message,`${input.code}:${input.eventId}`,input.eventId,GATEWAY).run();
  if(inserted.meta?.changes) await db.prepare("INSERT INTO sms_message_events(tenant_id,message_id,state) VALUES(?,?,'queued')").bind(TENANT,id).run();
  return true;
}
