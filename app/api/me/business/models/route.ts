import { getOwnedBusiness } from "@/lib/server/business-media";
import { businessModelNames, ensureBusinessModels } from "@/lib/server/business-models";
export async function GET(request: Request) {
  const owned=await getOwnedBusiness(request);if(!owned)return Response.json({ok:false},{status:401});
  return Response.json({ok:true,names:await businessModelNames(owned.db,owned.business.id)},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PUT(request: Request) {
  const owned=await getOwnedBusiness(request);if(!owned)return Response.json({ok:false},{status:401});
  const body=await request.json().catch(()=>null);
  if(!Array.isArray(body?.names)||body.names.length>100||body.names.some((n:unknown)=>typeof n!=="string"||n.trim().length<1||n.length>100))return Response.json({ok:false,error:"INVALID_MODELS"},{status:400});
  const names=[...new Set(body.names.map((n:string)=>n.trim()))];
  await ensureBusinessModels(owned.db);
  await owned.db.prepare("INSERT INTO business_models(business_id,names) VALUES(?,?) ON CONFLICT(business_id) DO UPDATE SET names=excluded.names").bind(owned.business.id,JSON.stringify(names)).run();
  return Response.json({ok:true,names});
}
