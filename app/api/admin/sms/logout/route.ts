import {isAdminRequest,clearAdminCookie} from "@/lib/server/admin-session";
import {clearSmsCookie} from "@/lib/server/sms/admin-auth";
import {noStore} from "@/lib/server/sms/domain";

export async function POST(request:Request){
  if(!await isAdminRequest(request))return noStore({ok:false},401);
  const headers=new Headers({"Cache-Control":"no-store"});
  headers.append("Set-Cookie",clearAdminCookie());headers.append("Set-Cookie",clearSmsCookie());
  return Response.json({ok:true},{headers});
}
