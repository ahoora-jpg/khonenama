import {env} from "cloudflare:workers";
import {isAdminRequest} from "@/lib/server/admin-session";
import {isSmsAdminRequest,smsKeyConfigured} from "@/lib/server/sms/admin-auth";
import {liveSmsEnabled} from "@/lib/server/sms/config";
import {noStore} from "@/lib/server/sms/domain";

export async function GET(request:Request){
  if(!await isAdminRequest(request))return noStore({ok:false,error:"SITE_ADMIN_REQUIRED"},401);
  return noStore({ok:true,keyRequired:smsKeyConfigured(),authenticated:await isSmsAdminRequest(request),liveSendingEnabled:liveSmsEnabled(env as any)});
}
