import {env} from "cloudflare:workers";
import {isSmsAdminRequest} from "@/lib/server/sms/admin-auth";
import {TENANT,maskPhone,noStore} from "@/lib/server/sms/domain";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await isSmsAdminRequest(request))return noStore({ok:false},401);
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/.test(id))return noStore({ok:false},400);
  const db=(env as any).DB;
  const row=await db.prepare("SELECT m.id,m.category,m.body,m.status,m.gateway_message_id,m.created_at,m.updated_at,c.phone_e164 FROM sms_messages m JOIN sms_contacts c ON c.id=m.contact_id WHERE m.id=? AND m.tenant_id=?").bind(id,TENANT).first();
  if(!row)return noStore({ok:false},404);
  const events=await db.prepare("SELECT state,detail,created_at FROM sms_message_events WHERE tenant_id=? AND message_id=? ORDER BY id").bind(TENANT,id).all();
  return noStore({ok:true,message:{...row,phone_e164:maskPhone(row.phone_e164)},events:events.results});
}
