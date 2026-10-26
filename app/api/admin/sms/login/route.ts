import {isAdminRequest} from "@/lib/server/admin-session";
import {allowAdminLogin} from "@/lib/server/admin-login-rate-limit";
import {createSmsCookie,verifySmsKey} from "@/lib/server/sms/admin-auth";
import {noStore} from "@/lib/server/sms/domain";
export async function POST(request:Request){
  if(!await isAdminRequest(request))return noStore({ok:false,error:"SITE_ADMIN_REQUIRED"},401);
  if(!await allowAdminLogin(request))return noStore({ok:false,error:"RATE_LIMITED"},429);
  const input=await request.json().catch(()=>null);
  if(typeof input?.key!=="string" || input.key.length>256 || !await verifySmsKey(input.key))return noStore({ok:false,error:"INVALID_SMS_KEY"},401);
  return Response.json({ok:true},{headers:{"Cache-Control":"no-store","Set-Cookie":await createSmsCookie()}});
}
