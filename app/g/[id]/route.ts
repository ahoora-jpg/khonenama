import { env } from "cloudflare:workers";

// A printed gallery link survives changes to the business slug.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!/^[1-9]\d{0,14}$/.test(id)) return new Response("گالری پیدا نشد", { status: 404, headers });
  const db = (env as any).DB;
  if (!db) return new Response("سرویس موقتاً در دسترس نیست", { status: 503, headers });
  const business = await db.prepare(
    "SELECT b.slug FROM businesses b LEFT JOIN business_visibility_controls v ON v.business_id = b.id WHERE b.id = ? AND b.status = 'published' AND COALESCE(v.owner_paused, 0) = 0 LIMIT 1"
  ).bind(Number(id)).first();
  if (!business?.slug) return new Response("گالری پیدا نشد", { status: 404, headers });
  return new Response(null, { status: 302, headers: { ...headers, Location: "https://khonenama.ir/business/" + encodeURIComponent(business.slug) + "#gallery" } });
}
