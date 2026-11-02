import {isAdminRequest} from "@/lib/server/admin-session";
import {allowAdminLogin} from "@/lib/server/admin-login-rate-limit";
import {createSmsCookie,verifySmsKey,smsKeyConfigured} from "@/lib/server/sms/admin-auth";
import {noStore} from "@/lib/server/sms/domain";
export async function POST(request:Request){
  if(!await isAdminRequest(request))return noStore({ok:false,error:"SITE_ADMIN_REQUIRED"},401);
  if(!smsKeyConfigured())return noStore({ok:true,keyRequired:false});
  try {
    if(!await allowAdminLogin(request))return Response.json({ok:false,error:"RATE_LIMITED"},{status:429,headers:{"Cache-Control":"no-store","Retry-After":"900"}});
  } catch { return noStore({ok:false,error:"AUTH_UNAVAILABLE"},503); }
  const input=await request.json().catch(()=>null);
  if(typeof input?.key!=="string" || input.key.length>256 || !await verifySmsKey(input.key))return noStore({ok:false,error:"INVALID_SMS_KEY"},401);
  return Response.json({ok:true},{headers:{"Cache-Control":"no-store","Set-Cookie":await createSmsCookie()}});
}
