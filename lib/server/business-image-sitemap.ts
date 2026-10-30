import { env } from "cloudflare:workers";

export type BusinessImageSitemapEntry = {
  slug: string;
  name: string;
  city: string;
  area: string;
  images: { url: string; caption: string }[];
};

const MAX_BUSINESSES = 5000;
const INTERNAL_TEST_BUSINESS_SLUGS = ["alayy-dkvr-krj"];

async function ensureVisibilitySchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_visibility_controls (" +
      "business_id INTEGER PRIMARY KEY," +
      "owner_paused INTEGER NOT NULL DEFAULT 0," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ")"
  ).run();
}

/**
 * Image-sitemap lookup that does not hydrate full marketplace profiles.
 *
 * The public free plan already allows 10 gallery photos, while the image
 * sitemap emits at most 8 images per business. We therefore keep only the
 * first 10 gallery images by upload id plus the first cover/logo by display
 * order. This is a subset of media that can be public even on the free plan,
 * so subscription-only hidden media is never exposed here.
 */
export async function listPublishedBusinessImageSitemapEntries(): Promise<BusinessImageSitemapEntry[]> {
  try {
    const db = (env as any).DB;
    if (!db) return [];
    await ensureVisibilitySchema(db);

    const placeholders = INTERNAL_TEST_BUSINESS_SLUGS.map(() => "?").join(",");
    const sql =
      "WITH eligible AS (" +
      " SELECT b.id,b.slug,b.name,b.city,b.area,b.updated_at" +
      " FROM businesses b" +
      " WHERE b.status='published'" +
      " AND b.slug NOT GLOB 'ghrfh-azmayshy-tbdyl-[0-9]*-thran'" +
      " AND length(trim(COALESCE(b.slug,'')))>2" +
      " AND length(trim(COALESCE(b.name,'')))>=2" +
      " AND length(trim(COALESCE(b.description,'')))>=20" +
      " AND length(trim(COALESCE(b.city,'')))>=2" +
      " AND EXISTS (SELECT 1 FROM business_categories bc WHERE bc.business_id=b.id)" +
      " AND EXISTS (SELECT 1 FROM business_services bs WHERE bs.business_id=b.id)" +
      " AND EXISTS (SELECT 1 FROM business_service_areas sa WHERE sa.business_id=b.id)" +
      " AND NOT EXISTS (SELECT 1 FROM business_visibility_controls v WHERE v.business_id=b.id AND v.owner_paused=1)" +
      (INTERNAL_TEST_BUSINESS_SLUGS.length ? " AND b.slug NOT IN (" + placeholders + ")" : "") +
      " ORDER BY b.updated_at DESC,b.id DESC LIMIT " + MAX_BUSINESSES +
      "), ranked_media AS (" +
      " SELECT m.business_id,m.id,m.kind,m.media_type,m.file_url,m.alt_text,m.sort_order," +
      " ROW_NUMBER() OVER (PARTITION BY m.business_id,m.kind ORDER BY m.sort_order,m.id) AS kind_rank," +
      " SUM(CASE WHEN m.kind NOT IN ('cover','logo') AND COALESCE(m.media_type,'image')<>'video' THEN 1 ELSE 0 END)" +
      " OVER (PARTITION BY m.business_id ORDER BY m.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS gallery_rank" +
      " FROM business_media m JOIN eligible e ON e.id=m.business_id" +
      " WHERE length(trim(COALESCE(m.file_url,'')))>0 AND COALESCE(m.media_type,'image')<>'video'" +
      ")" +
      " SELECT e.id AS business_id,e.slug,e.name,e.city,e.area," +
      " r.id AS media_id,r.kind,r.file_url,r.alt_text,r.sort_order" +
      " FROM eligible e JOIN ranked_media r ON r.business_id=e.id" +
      " WHERE ((r.kind IN ('cover','logo') AND r.kind_rank=1)" +
      " OR (r.kind NOT IN ('cover','logo') AND r.gallery_rank<=10))" +
      " ORDER BY e.updated_at DESC,e.id DESC," +
      " CASE r.kind WHEN 'cover' THEN 0 WHEN 'logo' THEN 1 ELSE 2 END,r.sort_order,r.id";

    const result = await db.prepare(sql).bind(...INTERNAL_TEST_BUSINESS_SLUGS).all();
    const entries = new Map<number, BusinessImageSitemapEntry>();

    for (const row of result?.results || []) {
      const businessId = Number(row.business_id);
      let entry = entries.get(businessId);
      if (!entry) {
        entry = {
          slug: String(row.slug || ""),
          name: String(row.name || ""),
          city: String(row.city || ""),
          area: String(row.area || ""),
          images: [],
        };
        entries.set(businessId, entry);
      }
      if (entry.images.length >= 8) continue;
      const url = String(row.file_url || "");
      if (!url.startsWith("https://")) continue;
      const fallback = entry.name + "؛ نمونه‌کار یا تصویر کسب‌وکار" +
        (entry.city ? " در " + entry.city : "") + (entry.area ? "، " + entry.area : "");
      entry.images.push({
        url,
        caption: String(row.alt_text || "").trim() || fallback,
      });
    }

    return [...entries.values()].filter((entry) => entry.slug && entry.images.length > 0);
  } catch (error) {
    console.warn("business image sitemap lookup failed", error);
    return [];
  }
}
