import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = (env as any).DB;
  const result = await db
    .prepare(
      "SELECT r.id, r.business_id, r.rating, r.title, r.body, r.status, r.verified_interaction, r.created_at, " +
      "b.name AS business_name, b.slug AS business_slug " +
      "FROM reviews r JOIN businesses b ON b.id = r.business_id " +
      "ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'published' THEN 1 ELSE 2 END, r.created_at DESC LIMIT 200"
    )
    .all();

  return Response.json({ ok: true, reviews: result?.results || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reviewId = Number(body?.reviewId);
  const action = body?.action === "approve" ? "approve" : body?.action === "reject" ? "reject" : "";

  if (!Number.isInteger(reviewId) || reviewId < 1 || !action) {
    return Response.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
  }

  const db = (env as any).DB;
  const row = await db.prepare("SELECT id FROM reviews WHERE id = ? LIMIT 1").bind(reviewId).first();
  if (!row?.id) {
    return Response.json({ ok: false, error: "REVIEW_NOT_FOUND" }, { status: 404 });
  }

  const status = action === "approve" ? "published" : "rejected";
  await db.prepare("UPDATE reviews SET status = ? WHERE id = ?").bind(status, reviewId).run();

  return Response.json({ ok: true, status });
}
