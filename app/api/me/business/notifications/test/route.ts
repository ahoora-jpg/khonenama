import { getOwnedBusiness } from "@/lib/server/business-media";
import { ensurePushSchema } from "@/lib/server/business-push";
import { ensureWebPushSchema, getWebPushKeys } from "@/lib/server/business-web-push";
import { validPushEndpoint } from "@/lib/web-push-subscription";
import { buildPushPayload } from "@block65/webcrypto-web-push";
const headers={"Cache-Control":"no-store"};
export async function POST(request:Request){
  const owned=await getOwnedBusiness(request);
  if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401,headers});
  const body=await request.json().catch(()=>null);
  if(!body||!["web","app"].includes(body.kind))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400,headers});
  await ensurePushSchema(owned.db);await ensureWebPushSchema(owned.db);
  const row=body.kind==="web"?await owned.db.prepare("SELECT endpoint,subscription FROM business_web_push WHERE business_id=? AND user_id=? AND endpoint=? AND active=1").bind(owned.business.id,owned.session.user_id,String(body.endpoint||"")).first():await owned.db.prepare("SELECT expo_push_token FROM business_push_tokens WHERE business_id=? AND user_id=? AND expo_push_token=? AND active=1").bind(owned.business.id,owned.session.user_id,String(body.token||"")).first();
  if(!row)return Response.json({ok:false,error:"DEVICE_NOT_REGISTERED"},{status:400,headers});
  await owned.db.prepare("CREATE TABLE IF NOT EXISTS business_notification_test_limits (user_id TEXT PRIMARY KEY,last_sent TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  const claim=await owned.db.prepare("INSERT INTO business_notification_test_limits(user_id) VALUES(?) ON CONFLICT(user_id) DO UPDATE SET last_sent=CURRENT_TIMESTAMP WHERE last_sent<datetime('now','-1 minute') RETURNING user_id").bind(owned.session.user_id).first();
  if(!claim)return Response.json({ok:false,error:"TOO_MANY_ATTEMPTS"},{status:429,headers});
  try{
    let accepted=false;
    if(body.kind==="web"){
      if(!validPushEndpoint(row.endpoint))throw Error("INVALID_DEVICE");
      const keys=await getWebPushKeys(owned.db);
      const payload=await buildPushPayload({data:JSON.stringify({title:"آزمون اعلان خونه‌نما",body:"این پیام آزمایشی است؛ درخواست مشتری نیست.",url:"/dashboard#leads",tag:"notification-test"}),options:{ttl:300}},JSON.parse(row.subscription),{subject:"https://khonenama.ir/help",publicKey:keys.public_key,privateKey:keys.private_key});
      const response=await fetch(row.endpoint,{...payload,redirect:"manual",signal:AbortSignal.timeout(8000)});accepted=response.ok;
    }else{
      const response=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify([{to:row.expo_push_token,title:"آزمون اعلان خونه‌نما",body:"این پیام آزمایشی است؛ درخواست مشتری نیست.",sound:"default",priority:"high",channelId:"business-requests",data:{url:"/owner",test:true}}]),signal:AbortSignal.timeout(8000),redirect:"manual"});
      const data=await response.json() as any;accepted=response.ok&&data.data?.[0]?.status==="ok";
    }
    return Response.json({ok:accepted,providerAccepted:accepted,...(!accepted?{error:"PUSH_SEND_FAILED"}:{})},{status:accepted?200:503,headers});
  }catch{return Response.json({ok:false,error:"PUSH_SEND_FAILED"},{status:503,headers});}
}
