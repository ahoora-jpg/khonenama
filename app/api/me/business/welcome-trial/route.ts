import { getOwnedBusiness } from "@/lib/server/business-media";
import { ensureWelcomeTrialSchema, welcomeTrial } from "@/lib/server/welcome-trial";
export async function GET(request: Request) {
  const owned=await getOwnedBusiness(request);
  if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401});
  return Response.json({ok:true,...await welcomeTrial(owned.db,owned.business.id,owned.session.user_id)},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request: Request) {
  const owned=await getOwnedBusiness(request);
  if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401});
  await ensureWelcomeTrialSchema(owned.db);
  await owned.db.prepare("INSERT OR IGNORE INTO business_welcome_notices(user_id) VALUES(?)").bind(owned.session.user_id).run();
  return Response.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
}
