import { getOwnedBusiness } from "@/lib/server/business-media";
import { ensureReviewReplies } from "@/lib/server/review-replies";

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureReviewReplies(owned.db);
  const [summary, rows] = await Promise.all([
    owned.db
      .prepare(
        "SELECT " +
        "COUNT(CASE WHEN status = 'published' THEN 1 END) AS published_count, " +
        "COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count, " +
        "COALESCE(AVG(CASE WHEN status = 'published' THEN rating END),0) AS average_rating " +
        "FROM reviews WHERE business_id = ?"
      )
      .bind(owned.business.id)
      .first(),
    owned.db
      .prepare(
        "SELECT id, rating, title, body, status, verified_interaction, created_at, (SELECT body FROM review_replies rr WHERE rr.review_id = reviews.id) AS reply " +
        "FROM reviews WHERE business_id = ? ORDER BY created_at DESC, id DESC LIMIT 12"
      )
      .bind(owned.business.id)
      .all(),
  ]);

  return Response.json(
    {
      ok: true,
      summary: {
        published: Number(summary?.published_count || 0),
        pending: Number(summary?.pending_count || 0),
        average: Number(summary?.average_rating || 0),
      },
      reviews: rows?.results || [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  const input = await request.json().catch(() => null);
  const reviewId = Number(input?.reviewId);
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!Number.isSafeInteger(reviewId) || reviewId < 1 || body.length < 3 || body.length > 1500)
    return Response.json({ ok: false, error: "INVALID_REPLY" }, { status: 400 });
  const review = await owned.db.prepare("SELECT id FROM reviews WHERE id = ? AND business_id = ? AND status = 'published'").bind(reviewId, owned.business.id).first();
  if (!review) return Response.json({ ok: false, error: "REVIEW_NOT_FOUND" }, { status: 404 });
  await ensureReviewReplies(owned.db);
  await owned.db.prepare("INSERT INTO review_replies (review_id,business_id,body) VALUES (?,?,?) ON CONFLICT(review_id) DO UPDATE SET body = excluded.body, updated_at = CURRENT_TIMESTAMP").bind(reviewId, owned.business.id, body).run();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
