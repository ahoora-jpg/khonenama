import { getPublishedBusiness, isInternalTestBusinessSlug } from "@/lib/server/public-businesses";
import { env } from "cloudflare:workers";
import { listPublicBusinessAlbums } from "@/lib/server/business-albums";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const b = isInternalTestBusinessSlug(slug) ? null : await getPublishedBusiness(slug);
  if (!b) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const albums = await listPublicBusinessAlbums((env as any).DB, b.id, b.planCode, b.media.map(m=>m.id));
  return Response.json({ ok: true, data: {
    slug: b.slug, name: b.name, description: b.description, city: b.city, area: b.area,
    category: b.category, categoryName: b.categoryName, services: b.services,
    coverUrl: b.media.find(m => m.kind === "cover")?.url || b.media[0]?.url || "",
    verified: ["verified", "professional"].includes(b.verificationStatus),
    rating: b.rating, reviewCount: b.reviewCount, promoted: b.promoted,
    address: b.address, phone: b.phone, whatsapp: b.whatsapp, website: b.website, instagram: b.instagram,
    media: b.media.map(({ id, kind, url, altText }) => ({ id, kind, url, altText })),
    hours: b.hours, reviews: b.reviews, albums,
  } }, { headers: { "Cache-Control": "no-store" } });
}
