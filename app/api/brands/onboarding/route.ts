import { env } from "cloudflare:workers";
import { isBusinessCategorySlug } from "@/lib/business-taxonomy";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") || "";
  if (!isBusinessCategorySlug(category)) return Response.json({ ok: false, brands: [] }, { status: 400 });
  try {
    const rows = await (env as any).DB.prepare(
      "SELECT b.id,b.name FROM brands b JOIN brand_categories bc ON bc.brand_id=b.id JOIN categories c ON c.id=bc.category_id " +
      "WHERE b.status IN ('approved','published') AND c.slug=? ORDER BY b.name COLLATE NOCASE LIMIT 30"
    ).bind(category).all();
    return Response.json({ ok: true, brands: rows.results || [] }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
  } catch {
    // The catalogue is optional until its additive migrations have run.
    return Response.json({ ok: true, brands: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
