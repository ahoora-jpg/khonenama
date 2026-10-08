import { getOwnedBusiness } from "@/lib/server/business-media";
import { ensurePushSchema } from "@/lib/server/business-push";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const token = clean(body?.token, 240);
  const platform = ["android", "ios"].includes(body?.platform) ? String(body.platform) : "android";
  if (!/^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token) && !/^ExpoPushToken\[[A-Za-z0-9_-]+\]$/.test(token)) {
    return Response.json({ ok: false, error: "INVALID_PUSH_TOKEN" }, { status: 400 });
  }
  await ensurePushSchema(owned.db);
  await owned.db.prepare(
    "INSERT INTO business_push_tokens (business_id, user_id, expo_push_token, platform, active) VALUES (?, ?, ?, ?, 1) " +
    "ON CONFLICT(expo_push_token) DO UPDATE SET business_id = excluded.business_id, user_id = excluded.user_id, platform = excluded.platform, active = 1, updated_at = CURRENT_TIMESTAMP"
  ).bind(owned.business.id, owned.session.user_id, token, platform).run();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
 const owned=await getOwnedBusiness(request);
 if(!owned)return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401});
 const body=await request.json().catch(()=>({}));const token=clean(body?.token,240);
 if(!token)return Response.json({ok:false,error:"INVALID_PUSH_TOKEN"},{status:400});
 await ensurePushSchema(owned.db);
 await owned.db.prepare("UPDATE business_push_tokens SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE expo_push_token = ? AND user_id = ? AND business_id = ?").bind(token,owned.session.user_id,owned.business.id).run();
 return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
