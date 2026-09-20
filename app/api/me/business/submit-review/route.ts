import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";

export async function POST(request: Request) {
  const session = await getBusinessSession(request);
  if (!session?.user_id) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const db = (env as any).DB;
  const business = await db
    .prepare(
      "SELECT b.id, b.name, b.description, b.city, b.area, b.address, b.status, b.verification_status FROM businesses b JOIN business_members bm ON bm.business_id = b.id WHERE bm.user_id = ? AND bm.status = 'active' AND bm.role IN ('owner','manager') ORDER BY b.id DESC LIMIT 1"
    )
    .bind(session.user_id)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  if (business.status === "published") {
    return Response.json({ ok: true, status: "published" });
  }

  if (business.status === "pending") {
    return Response.json({ ok: true, status: "pending" });
  }

  const [serviceCount, areaCount] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM business_services WHERE business_id = ?").bind(business.id).first(),
    db.prepare("SELECT COUNT(*) AS count FROM business_service_areas WHERE business_id = ?").bind(business.id).first(),
  ]);

  const missing: string[] = [];
  if (!business.name) missing.push("name");
  if (!business.description || String(business.description).trim().length < 20) missing.push("description");
  if (!business.city) missing.push("city");
  if (!business.area) missing.push("area");
  if (Number(serviceCount?.count || 0) < 1) missing.push("services");
  if (Number(areaCount?.count || 0) < 1) missing.push("serviceAreas");

  if (missing.length) {
    return Response.json({ ok: false, error: "PROFILE_INCOMPLETE", missing }, { status: 409 });
  }

  const existing = await db
    .prepare(
      "SELECT id FROM verification_requests WHERE business_id = ? AND kind = 'business' AND status = 'pending' ORDER BY id DESC LIMIT 1"
    )
    .bind(business.id)
    .first();

  if (!existing?.id) {
    await db
      .prepare(
        "INSERT INTO verification_requests (business_id, requested_by_user_id, kind, status) VALUES (?, ?, 'business', 'pending')"
      )
      .bind(business.id, session.user_id)
      .run();
  }

  await db
    .prepare("UPDATE businesses SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(business.id)
    .run();

  return Response.json({ ok: true, status: "pending" });
}
