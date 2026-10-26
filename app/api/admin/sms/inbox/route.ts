import {env} from "cloudflare:workers";
import {isSmsAdminRequest} from "@/lib/server/sms/admin-auth";
import {TENANT,maskPhone,noStore} from "@/lib/server/sms/domain";
export async function GET(request:Request){
  if(!await isSmsAdminRequest(request))return noStore({ok:false},401);
  const db=(env as any).DB;
  const rows=await db.prepare("SELECT id,sender_e164,body,received_at FROM sms_inbound_messages WHERE tenant_id=? ORDER BY received_at DESC LIMIT 50").bind(TENANT).all();
  return noStore({ok:true,messages:rows.results.map((r:any)=>({...r,sender_e164:maskPhone(r.sender_e164)}))});
}
