import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = (env as any).DB;
  const rows = await db
    .prepare(
      "SELECT b.id, b.slug, b.name, b.description, b.city, b.area, b.phone, b.status, b.verification_status, b.created_at, b.updated_at, u.full_name AS owner_name, u.phone AS owner_phone, c.name AS category_name, vr.id AS review_request_id, vr.status AS review_status, vr.requested_at FROM businesses b LEFT JOIN users u ON u.id = b.owner_user_id LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id LEFT JOIN verification_requests vr ON vr.id = (SELECT id FROM verification_requests WHERE business_id = b.id AND kind = 'business' ORDER BY id DESC LIMIT 1) WHERE b.status IN ('pending','published','draft') ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, b.updated_at DESC LIMIT 100"
    )
    .all();

  return Response.json(
    { ok: true, businesses: rows?.results || [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
