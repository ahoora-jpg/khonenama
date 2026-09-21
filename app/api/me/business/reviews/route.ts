import { getOwnedBusiness } from "@/lib/server/business-media";

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

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
        "SELECT id, rating, title, body, status, verified_interaction, created_at " +
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
