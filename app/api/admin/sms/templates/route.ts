import {env} from "cloudflare:workers";
import {isSmsAdminRequest} from "@/lib/server/sms/admin-auth";
import {TENANT,noStore} from "@/lib/server/sms/domain";
export async function GET(request:Request){
  if(!await isSmsAdminRequest(request))return noStore({ok:false},401);
  const db=(env as any).DB;
  const rows=await db.prepare("SELECT id,code,category,body,enabled FROM sms_templates WHERE tenant_id=? ORDER BY code").bind(TENANT).all();
  return noStore({ok:true,templates:rows.results});
}
export async function POST(request:Request){
  if(!await isSmsAdminRequest(request))return noStore({ok:false},401);
  const db=(env as any).DB,input=await request.json().catch(()=>null);
  if(input?.action==="toggle"){
    if(!/^[a-z0-9_]{2,60}$/.test(input.code||"") || input.confirm!=="ENABLE" && input.confirm!=="DISABLE")return noStore({ok:false,error:"CONFIRMATION_REQUIRED"},400);
    const enabled=input.confirm==="ENABLE"?1:0;
    const row=await db.prepare("UPDATE sms_templates SET enabled=? WHERE tenant_id=? AND code=? RETURNING id").bind(enabled,TENANT,input.code).first();
    if(!row)return noStore({ok:false,error:"NOT_FOUND"},404);
    await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin',?,?)").bind(TENANT,enabled?"template_enabled":"template_disabled",input.code).run();
    return noStore({ok:true,enabled:Boolean(enabled)});
  }
  if(!input || !/^[a-z0-9_]{2,60}$/.test(input.code||"") || !["transactional","promotional"].includes(input.category) || typeof input.body!=="string" || !input.body.trim() || input.body.length>1000)
    return noStore({ok:false,error:"INVALID_TEMPLATE"},400);
  await db.prepare(`INSERT INTO sms_templates(id,tenant_id,code,category,body,enabled) VALUES(?,?,?,?,?,0)
    ON CONFLICT(tenant_id,code) DO UPDATE SET body=excluded.body,category=excluded.category,enabled=0`)
    .bind(crypto.randomUUID(),TENANT,input.code,input.category,input.body.trim()).run();
  await db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin','template_saved',?)").bind(TENANT,input.code).run();
  return noStore({ok:true,enabled:false});
}
