import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { ensureLaunchOffer } from "@/lib/server/launch-offer";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ok:false},{status:401});
  const db=(env as any).DB;
  await ensureLaunchOffer(db);
  const settings=await db.prepare("SELECT *,datetime(starts_at,'+'||enrollment_days||' days') AS enrollment_ends_at FROM launch_offer_settings WHERE id=1").first();
  const count=await db.prepare("SELECT COUNT(*) AS total FROM launch_offer_grants").first();
  return Response.json({ok:true,settings,grantedCount:count?.total || 0},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ok:false},{status:401});
  const body=await request.json().catch(()=>null);
  const enrollmentDays=Number(body?.enrollmentDays),benefitDays=Number(body?.benefitDays);
  const startsAt=typeof body?.startsAt==='string' && Number.isFinite(Date.parse(body.startsAt)) ? new Date(body.startsAt).toISOString() : null;
  if(typeof body?.enabled!=='boolean' || !startsAt || !Number.isSafeInteger(enrollmentDays) || enrollmentDays<1 || enrollmentDays>365 || !Number.isSafeInteger(benefitDays) || benefitDays<1 || benefitDays>3650) return Response.json({ok:false,error:"INVALID_SETTINGS"},{status:400});
  const db=(env as any).DB; await ensureLaunchOffer(db);
  await db.batch([
    db.prepare("UPDATE launch_offer_settings SET enabled=?,starts_at=?,enrollment_days=?,benefit_days=?,updated_at=CURRENT_TIMESTAMP WHERE id=1").bind(body.enabled?1:0,startsAt,enrollmentDays,benefitDays),
    db.prepare("INSERT INTO launch_offer_changes(settings_json) VALUES(?)").bind(JSON.stringify({enabled:body.enabled,startsAt,enrollmentDays,benefitDays})),
  ]);
  return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
