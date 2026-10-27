import {env} from "cloudflare:workers";
import {isSmsAdminRequest} from "@/lib/server/sms/admin-auth";
import {TENANT,noStore,normalizePhone} from "@/lib/server/sms/domain";
import {liveSmsEnabled} from "@/lib/server/sms/config";

function csvRows(value:string):string[][]{
  const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
  for(let i=0;i<value.length;i++){
    const c=value[i];
    if(c==='"'){if(quoted&&value[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field="";}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&value[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field="";}
    else field+=c;
  }
  if(quoted)throw Error("INVALID_CSV");
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}

export async function POST(request:Request){
  if(!await isSmsAdminRequest(request)) return noStore({ok:false},401);
  const db=(env as any).DB;
  if(!db) return noStore({ok:false,error:"DB_UNAVAILABLE"},503);
  const body=await request.json().catch(()=>null);
  if(!body || typeof body!=="object") return noStore({ok:false,error:"INVALID_JSON"},400);
  if(body.action==="renameGroup" || body.action==="removeMember"){
    const groupId=String(body.groupId||"").slice(0,64);
    const group=await db.prepare("SELECT id FROM sms_contact_groups WHERE id=? AND tenant_id=?").bind(groupId,TENANT).first();
    if(!group)return noStore({ok:false},404);
    if(body.action==="renameGroup"){
      const name=String(body.name||"").trim().slice(0,100);if(!name)return noStore({ok:false,error:"NAME_REQUIRED"},400);
      const duplicate=await db.prepare("SELECT id FROM sms_contact_groups WHERE tenant_id=? AND name=? AND id<>?").bind(TENANT,name,groupId).first();
      if(duplicate)return noStore({ok:false,error:"GROUP_EXISTS"},409);
      await db.prepare("UPDATE sms_contact_groups SET name=? WHERE id=? AND tenant_id=?").bind(name,groupId,TENANT).run();
    }else await db.prepare("DELETE FROM sms_group_members WHERE tenant_id=? AND group_id=? AND contact_id=?").bind(TENANT,groupId,String(body.contactId||"").slice(0,64)).run();
    await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin',?,?)").bind(TENANT,body.action,groupId).run();
    return noStore({ok:true});
  }
  if(body.action==="group"){
    const name=String(body.name||"").trim().slice(0,100);
    if(!name) return noStore({ok:false,error:"NAME_REQUIRED"},400);
    const id=crypto.randomUUID();
    await db.prepare("INSERT OR IGNORE INTO sms_contact_groups(id,tenant_id,name) VALUES(?,?,?)").bind(id,TENANT,name).run();
    const row=await db.prepare("SELECT id FROM sms_contact_groups WHERE tenant_id=? AND name=?").bind(TENANT,name).first();
    return noStore({ok:true,id:row.id});
  }
  if(body.action==="member"){
    const groupId=String(body.groupId||""),contactId=String(body.contactId||"");
    const [group,contact]=await Promise.all([
      db.prepare("SELECT id FROM sms_contact_groups WHERE id=? AND tenant_id=?").bind(groupId,TENANT).first(),
      db.prepare("SELECT id FROM sms_contacts WHERE id=? AND tenant_id=?").bind(contactId,TENANT).first(),
    ]);
    if(!group || !contact) return noStore({ok:false,error:"NOT_FOUND"},404);
    await db.prepare("INSERT OR IGNORE INTO sms_group_members(tenant_id,group_id,contact_id) VALUES(?,?,?)").bind(TENANT,groupId,contactId).run();
    return noStore({ok:true});
  }
  if(body.action==="importCsv"){
    const groupId=String(body.groupId||""),content=String(body.csv||"");
    if(content.length>100_000) return noStore({ok:false,error:"CSV_TOO_LARGE"},413);
    const group=await db.prepare("SELECT id FROM sms_contact_groups WHERE id=? AND tenant_id=?").bind(groupId,TENANT).first();
    if(!group) return noStore({ok:false,error:"GROUP_NOT_FOUND"},404);
    let rows:string[][];try{rows=csvRows(content);}catch{return noStore({ok:false,error:"INVALID_CSV"},400);}
    if(rows.length>201) return noStore({ok:false,error:"TOO_MANY_ROWS"},400);
    const header=rows.shift()?.map(v=>v.trim().toLowerCase());
    if(!header || header[0]!=="phone") return noStore({ok:false,error:"PHONE_HEADER_REQUIRED"},400);
    let imported=0,invalid=0;
    for(const row of rows){
      const phone=normalizePhone(row[0]);if(!phone){invalid++;continue;}
      await db.prepare("INSERT OR IGNORE INTO sms_contacts(id,tenant_id,phone_e164,display_name,source) VALUES(?,?,?,?,'csv_import')")
        .bind(crypto.randomUUID(),TENANT,phone,String(row[1]||"").trim().slice(0,120)).run();
      const contact=await db.prepare("SELECT id FROM sms_contacts WHERE tenant_id=? AND phone_e164=?").bind(TENANT,phone).first();
      await db.prepare("INSERT OR IGNORE INTO sms_group_members(tenant_id,group_id,contact_id) VALUES(?,?,?)").bind(TENANT,groupId,contact.id).run();
      imported++;
    }
    await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(?,'site_admin','csv_import',?,?)").bind(TENANT,groupId,JSON.stringify({imported,invalid})).run();
    return noStore({ok:true,imported,invalid,consentGranted:0});
  }
  if(body.action==="create"){
    const name=String(body.name||"").trim().slice(0,120),text=String(body.body||"").trim().slice(0,1000);
    const max=Number(body.maxRecipients), groupId=String(body.groupId||"");
    if(!name || !text || !Number.isSafeInteger(max) || max<1 || max>10000) return noStore({ok:false,error:"INVALID_CAMPAIGN"},400);
    const scheduledAt=body.scheduledAt?String(body.scheduledAt):null;
    if(scheduledAt && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(scheduledAt) || Date.parse(scheduledAt)<=Date.now()))
      return noStore({ok:false,error:"INVALID_SCHEDULE"},400);
    const group=await db.prepare("SELECT id FROM sms_contact_groups WHERE id=? AND tenant_id=?").bind(groupId,TENANT).first();
    if(!group) return noStore({ok:false,error:"GROUP_NOT_FOUND"},404);
    const id=crypto.randomUUID();
    await db.prepare("INSERT INTO sms_campaigns(id,tenant_id,name,body,group_id,max_recipients,scheduled_at) VALUES(?,?,?,?,?,?,?)")
      .bind(id,TENANT,name,text,groupId,max,scheduledAt).run();
    await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin','campaign_created',?)").bind(TENANT,id).run();
    return noStore({ok:true,id});
  }
  if(body.action==="retryEmpty"){
    if(!liveSmsEnabled(env as any))return noStore({ok:false,error:"LIVE_SEND_DISABLED"},403);
    const id=String(body.id||"");
    const row=await db.prepare("UPDATE sms_campaigns SET status='approved',approved_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status='completed' AND NOT EXISTS(SELECT 1 FROM sms_campaign_recipients cr WHERE cr.campaign_id=sms_campaigns.id) AND NOT EXISTS(SELECT 1 FROM sms_messages m WHERE m.campaign_id=sms_campaigns.id AND m.tenant_id=sms_campaigns.tenant_id) RETURNING id").bind(id,TENANT).first();
    if(!row)return noStore({ok:false,error:"INVALID_TRANSITION"},409);
    await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin','campaign_retry_empty',?)").bind(TENANT,id).run();
    return noStore({ok:true});
  }
  if(["approve","pause","resume","cancel"].includes(body.action)){
    if(["approve","resume"].includes(body.action)&&!liveSmsEnabled(env as any))return noStore({ok:false,error:"LIVE_SEND_DISABLED"},403);
    const id=String(body.id||"");
    const update:Record<string,[string,string]>={approve:["draft","approved"],pause:["running","paused"],resume:["paused","running"],cancel:["draft","cancelled"]};
    const pair=update[body.action];
    let row;
    if(body.action==="cancel") row=await db.prepare("UPDATE sms_campaigns SET status='cancelled' WHERE id=? AND tenant_id=? AND status IN ('draft','approved','running','paused') RETURNING id").bind(id,TENANT).first();
    else row=await db.prepare("UPDATE sms_campaigns SET status=?,approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END WHERE id=? AND tenant_id=? AND status=? RETURNING id")
      .bind(pair[1],pair[1],id,TENANT,pair[0]).first();
    if(!row) return noStore({ok:false,error:"INVALID_TRANSITION"},409);
    if(body.action==="cancel") await db.prepare("UPDATE sms_messages SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE campaign_id=? AND tenant_id=? AND status='queued'").bind(id,TENANT).run();
    await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin',?,?)").bind(TENANT,"campaign_"+body.action,id).run();
    return noStore({ok:true});
  }
  return noStore({ok:false,error:"UNKNOWN_ACTION"},400);
}

export async function GET(request:Request){
  if(!await isSmsAdminRequest(request)) return noStore({ok:false},401);
  const db=(env as any).DB;
  const [groups,campaigns]=await Promise.all([
    db.prepare("SELECT id,name FROM sms_contact_groups WHERE tenant_id=? ORDER BY name").bind(TENANT).all(),
    db.prepare(`SELECT c.id,c.name,c.body,c.status,c.max_recipients,c.scheduled_at,
      (SELECT COUNT(*) FROM sms_group_members gm JOIN sms_contacts co ON co.id=gm.contact_id WHERE gm.group_id=c.group_id AND co.tenant_id=c.tenant_id) AS group_count,
      (SELECT COUNT(*) FROM sms_group_members gm JOIN sms_contacts co ON co.id=gm.contact_id
        WHERE gm.group_id=c.group_id AND co.tenant_id=c.tenant_id
          AND NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=co.tenant_id AND o.contact_id=co.id)) AS eligible_count,
      (SELECT COUNT(*) FROM sms_campaign_recipients cr WHERE cr.campaign_id=c.id) AS queued_count
      FROM sms_campaigns c WHERE c.tenant_id=? ORDER BY c.created_at DESC LIMIT 50`).bind(TENANT).all(),
  ]);
  return noStore({ok:true,groups:groups.results,campaigns:campaigns.results,liveSendingEnabled:liveSmsEnabled(env as any)});
}
