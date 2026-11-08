import { env } from "cloudflare:workers";
import { listPublishedBusinesses, type PublicBusiness } from "@/lib/server/public-businesses";

export type PublicBrandReference = { title: string; type: "product_page" | "category_page" | "catalogue" | "website"; sourceUrl: string; };
export type PublicBrand = { id: number; slug: string; name: string; description: string; officialUrl: string; categories: { slug: string; name: string }[]; references: PublicBrandReference[]; };
function db() { return (env as any).DB; }

async function hydrateBrand(row: any): Promise<PublicBrand | null> {
  const database = db();
  if (!database || !row?.id) return null;
  const [categories, references] = await database.batch([
    database.prepare("SELECT c.slug,c.name FROM brand_categories bc JOIN categories c ON c.id=bc.category_id WHERE bc.brand_id=? ORDER BY c.sort_order,c.name").bind(row.id),
    database.prepare("SELECT title,reference_type,source_url FROM brand_product_references WHERE brand_id=? ORDER BY sort_order,id").bind(row.id),
  ]);
  return { id: Number(row.id), slug: String(row.slug), name: String(row.name), description: String(row.description || ""), officialUrl: String(row.official_url || ""), categories: (categories.results || []).map((item: any) => ({ slug: String(item.slug), name: String(item.name) })), references: (references.results || []).map((item: any) => ({ title: String(item.title), type: item.reference_type as PublicBrandReference["type"], sourceUrl: String(item.source_url) })) };
}
export async function listPublicBrands(): Promise<PublicBrand[]> {
  try {
    const database = db(); if (!database) return [];
    const result = await database.prepare("SELECT id,slug,name,description,official_url FROM brands WHERE status='published' ORDER BY name COLLATE NOCASE LIMIT 100").all();
    const brands = await Promise.all((result.results || []).map(hydrateBrand));
    return brands.filter((brand): brand is PublicBrand => Boolean(brand));
  } catch { return []; }
}
export async function getPublicBrand(slug: string): Promise<PublicBrand | null> {
  try {
    const database = db(); if (!database) return null;
    return hydrateBrand(await database.prepare("SELECT id,slug,name,description,official_url FROM brands WHERE status='published' AND slug=? LIMIT 1").bind(slug).first());
  } catch { return null; }
}
export async function listBusinessesForBrand(brandId: number): Promise<PublicBusiness[]> {
  try {
    const database = db(); if (!database) return [];
    const result = await database.prepare("SELECT business_id FROM business_brand_claims WHERE brand_id=? AND verification_status IN ('self_declared','pending_review','verified') LIMIT 50").bind(brandId).all();
    const ids = (result.results || []).map((item: any) => Number(item.business_id)).filter(Number.isSafeInteger);
    return listPublishedBusinesses({ businessIds: ids, limit: 50 });
  } catch { return []; }
}
