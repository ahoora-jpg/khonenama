import {getOwnedBusiness} from "@/lib/server/business-media";
import {getWebPushKeys,ensureWebPushSchema} from "@/lib/server/business-web-push";
import {cleanPushSubscription,validPushEndpoint} from "@/lib/web-push-subscription";
const headers={"Cache-Control":"no-store"};
export async function GET(request:Request){
 const owned=await getOwnedBusiness(request);if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401,headers});
 const keys=await getWebPushKeys(owned.db);return Response.json({ok:true,publicKey:keys.public_key},{headers});
}
export async function POST(request:Request){
 const owned=await getOwnedBusiness(request);if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401,headers});
 const body=await request.json().catch(()=>null),subscription=cleanPushSubscription(body);
 if(!subscription)return Response.json({ok:false,error:"INVALID_SUBSCRIPTION"},{status:400,headers});
 await ensureWebPushSchema(owned.db);
 const count=await owned.db.prepare("SELECT COUNT(*) AS total FROM business_web_push WHERE business_id=? AND active=1 AND endpoint<>?").bind(owned.business.id,subscription.endpoint).first();
 if(Number(count?.total)>=20)return Response.json({ok:false,error:"DEVICE_LIMIT"},{status:400,headers});
 await owned.db.prepare("INSERT INTO business_web_push(business_id,user_id,endpoint,subscription) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET business_id=excluded.business_id,user_id=excluded.user_id,subscription=excluded.subscription,active=1,updated_at=CURRENT_TIMESTAMP").bind(owned.business.id,owned.session.user_id,subscription.endpoint,JSON.stringify(subscription)).run();
 return Response.json({ok:true},{headers});
}
export async function DELETE(request:Request){
 const owned=await getOwnedBusiness(request);if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401,headers});
 const body=await request.json().catch(()=>null);if(!validPushEndpoint(body?.endpoint))return Response.json({ok:false,error:"INVALID_SUBSCRIPTION"},{status:400,headers});
 await ensureWebPushSchema(owned.db);
 await owned.db.prepare("UPDATE business_web_push SET active=0 WHERE endpoint=? AND business_id=? AND user_id=?").bind(body.endpoint,owned.business.id,owned.session.user_id).run();
 return Response.json({ok:true},{headers});
}
