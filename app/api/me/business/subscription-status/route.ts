import {getOwnedBusiness} from "@/lib/server/business-media";
import {subscriptionNotice} from "@/lib/subscription-lifecycle";
export async function GET(request:Request){
 const owned=await getOwnedBusiness(request);
 if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401});
 const row=await owned.db.prepare("SELECT p.code,s.status,s.ends_at FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND s.status IN ('active','expired') ORDER BY s.id DESC LIMIT 1").bind(owned.business.id).first();
 return Response.json({ok:true,...subscriptionNotice(row)},{headers:{"Cache-Control":"private, no-store"}});
}
