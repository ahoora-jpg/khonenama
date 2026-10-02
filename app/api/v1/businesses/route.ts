import { listPublishedBusinesses } from "@/lib/server/public-businesses";

const clean = (value: string | null) => (value || "").trim().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\u200c/g, " ").replace(/\s+/g, " ").slice(0, 150);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsedLimit = Number(params.get("limit") || 30);
  const businesses = await listPublishedBusinesses({
    query: clean(params.get("q")) || undefined,
    location: clean(params.get("location")) || undefined,
    categorySlug: clean(params.get("category")) || undefined,
    limit: Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 50)) : 30,
  });
  return Response.json({ ok: true, data: businesses.map(b => ({
    slug: b.slug, name: b.name, description: b.description, city: b.city, area: b.area,
    category: b.category, categoryName: b.categoryName, services: b.services,
    coverUrl: b.media.find(m => m.kind === "cover")?.url || b.media[0]?.url || "",
    verified: ["verified", "professional"].includes(b.verificationStatus),
    rating: b.rating, reviewCount: b.reviewCount, promoted: b.promoted,
  })) }, { headers: { "Cache-Control": "no-store" } });
}
