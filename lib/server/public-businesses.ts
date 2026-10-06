import {selectPublicMedia} from "@/lib/subscription-lifecycle";
import { env } from "cloudflare:workers";
import { ensureBusinessMediaSchema } from "@/lib/server/business-media";
import { ensureReviewReplies } from "@/lib/server/review-replies";

export type PublicBusiness = {
  id: number;
  slug: string;
  name: string;
  description: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
  status: string;
  verificationStatus: string;
  featured: boolean;
  category: string;
  categoryName: string;
  categories: { slug: string; name: string; primary: boolean }[];
  services: string[];
  media: { id: number; kind: string; url: string; thumbnailUrl: string; altText: string; sortOrder: number }[];
  hours: { weekday: number; opensAt: string; closesAt: string; isClosed: boolean }[];
  planCode: "free" | "pro" | "premium";
  planName: string;
  promoted: boolean;
  rating: number;
  reviewCount: number;
  reviews: { id: number; name: string; rating: number; body: string; reply: string; verifiedInteraction: boolean; createdAt: string }[];
};

const INTERNAL_TEST_BUSINESS_SLUGS = new Set(["alayy-dkvr-krj"]);

export function isInternalTestBusinessSlug(slug: string) {
  return INTERNAL_TEST_BUSINESS_SLUGS.has(slug);
}

function getDb() {
  return (env as any).DB;
}

async function ensureVisibilitySchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_visibility_controls (" +
      "business_id INTEGER PRIMARY KEY," +
      "owner_paused INTEGER NOT NULL DEFAULT 0," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ")"
  ).run();
}

async function hydrate(rows: any[]): Promise<PublicBusiness[]> {
  const db = getDb();
  if (!db || !rows.length) return [];

  await ensureBusinessMediaSchema(db);
  await ensureReviewReplies(db);

  const result: PublicBusiness[] = [];
  for (const row of rows) {
    const [servicesResult, categoriesResult, reviewResult, planResult, promotionResult, mediaResult, hoursResult, reviewsResult] = await Promise.all([
      db
        .prepare(
          "SELECT s.name FROM business_services bs JOIN services s ON s.id = bs.service_id WHERE bs.business_id = ? ORDER BY s.id"
        )
        .bind(row.id)
        .all(),
      db
        .prepare(
          "SELECT c.slug, c.name, bc.is_primary FROM business_categories bc JOIN categories c ON c.id = bc.category_id WHERE bc.business_id = ? ORDER BY bc.is_primary DESC, c.sort_order, c.name"
        )
        .bind(row.id)
        .all(),
      db
        .prepare(
          "SELECT COUNT(*) AS review_count, COALESCE(AVG(rating),0) AS rating FROM reviews WHERE business_id = ? AND status = 'published'"
        )
        .bind(row.id)
        .first(),
      db
        .prepare(
          "SELECT p.code, p.name FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.business_id = ? AND s.status = 'active' AND (s.ends_at IS NULL OR julianday(s.ends_at) > julianday('now')) ORDER BY s.id DESC LIMIT 1"
        )
        .bind(row.id)
        .first(),
      db
        .prepare(
          "SELECT id FROM promotions WHERE business_id = ? AND status = 'active' AND starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP LIMIT 1"
        )
        .bind(row.id)
        .first(),
      db
        .prepare(
          "SELECT id, kind, file_url, thumbnail_url, alt_text, sort_order FROM business_media WHERE business_id = ? AND file_url IS NOT NULL AND file_url <> '' ORDER BY CASE kind WHEN 'cover' THEN 0 WHEN 'logo' THEN 1 ELSE 2 END, sort_order, id"
        )
        .bind(row.id)
        .all(),
      db
        .prepare(
          "SELECT weekday, opens_at, closes_at, is_closed FROM business_hours WHERE business_id = ? ORDER BY weekday"
        )
        .bind(row.id)
        .all(),
      db
        .prepare(
          "SELECT id, rating, title, body, verified_interaction, created_at, (SELECT body FROM review_replies rr WHERE rr.review_id = reviews.id) AS reply FROM reviews " +
          "WHERE business_id = ? AND status = 'published' ORDER BY created_at DESC, id DESC LIMIT 8"
        )
        .bind(row.id)
        .all(),
    ]);

    result.push({
      id: Number(row.id),
      slug: row.slug,
      name: row.name,
      description: row.description || "",
      city: row.city || "",
      area: row.area || "",
      address: row.address || "",
      phone: row.phone || "",
      whatsapp: row.whatsapp || "",
      website: row.website || "",
      instagram: row.instagram || "",
      status: row.status,
      verificationStatus: row.verification_status,
      featured: Boolean(row.is_featured),
      category: row.category_slug || "",
      categoryName: row.category_name || "",
      categories: (categoriesResult?.results || []).map((item: any) => ({
        slug: item.slug,
        name: item.name,
        primary: Boolean(item.is_primary),
      })),
      services: (servicesResult?.results || []).map((item: any) => item.name),
      media: selectPublicMedia<PublicBusiness["media"][number]>((mediaResult?.results || []).map((item: any) => ({
        id: Number(item.id),
        kind: item.kind || "image",
        url: item.file_url || "",
        thumbnailUrl: item.thumbnail_url || "",
        altText: item.alt_text || "",
        sortOrder: Number(item.sort_order || 0),
      })), planResult?.code),
      hours: (hoursResult?.results || []).map((item: any) => ({
        weekday: Number(item.weekday),
        opensAt: item.opens_at || "",
        closesAt: item.closes_at || "",
        isClosed: Boolean(item.is_closed),
      })),
      planCode: planResult?.code === "premium" ? "premium" : planResult?.code === "pro" ? "pro" : "free",
      planName: planResult?.name || "پایه",
      promoted: Boolean(promotionResult?.id) || planResult?.code === "premium",
      rating: Number(reviewResult?.rating || 0),
      reviewCount: Number(reviewResult?.review_count || 0),
      reviews: (reviewsResult?.results || []).map((item: any) => ({
        id: Number(item.id),
        name: item.title || "مشتری خونه نما",
        rating: Number(item.rating || 0),
        body: item.body || "",
        reply: item.reply || "",
        verifiedInteraction: Boolean(item.verified_interaction),
        createdAt: item.created_at || "",
      })),
    });
  }

  return result;
}

export async function getPublishedBusiness(slug: string): Promise<PublicBusiness | null> {
  try {
    const db = getDb();
    if (!db) return null;

    await ensureVisibilitySchema(db);
    const row = await db
      .prepare(
        "SELECT b.*, c.slug AS category_slug, c.name AS category_name FROM businesses b LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id WHERE b.slug = ? AND b.status = 'published' AND NOT EXISTS (SELECT 1 FROM business_visibility_controls bvc WHERE bvc.business_id = b.id AND bvc.owner_paused = 1) LIMIT 1"
      )
      .bind(slug)
      .first();

    if (!row?.id) return null;
    const items = await hydrate([row]);
    return items[0] || null;
  } catch (error) {
    console.warn("public business lookup failed", error);
    return null;
  }
}

export async function listPublishedBusinesses(options: {
  categorySlug?: string;
  serviceName?: string;
  city?: string;
  area?: string;
  location?: string;
  query?: string;
  limit?: number;
} = {}): Promise<PublicBusiness[]> {
  try {
    const db = getDb();
    if (!db) return [];

    await ensureVisibilitySchema(db);
    const where = [
      "b.status = 'published'",
      "NOT EXISTS (SELECT 1 FROM business_visibility_controls bvc WHERE bvc.business_id = b.id AND bvc.owner_paused = 1)",
      "b.slug NOT IN (" + Array.from(INTERNAL_TEST_BUSINESS_SLUGS).map(() => "?").join(",") + ")",
    ];
    const binds: any[] = [...INTERNAL_TEST_BUSINESS_SLUGS];

    if (options.categorySlug) {
      where.push(
        "EXISTS (SELECT 1 FROM business_categories bcx JOIN categories cx ON cx.id = bcx.category_id WHERE bcx.business_id = b.id AND cx.slug = ?)"
      );
      binds.push(options.categorySlug);
    }

    if (options.serviceName) {
      where.push("EXISTS (SELECT 1 FROM business_services bss JOIN services ss ON ss.id = bss.service_id WHERE bss.business_id = b.id AND ss.name = ?)");
      binds.push(options.serviceName);
      where.push("length(trim(COALESCE(b.name,''))) >= 2 AND length(trim(COALESCE(b.description,''))) >= 20 AND length(trim(COALESCE(b.city,''))) >= 2 AND EXISTS (SELECT 1 FROM business_service_areas sa WHERE sa.business_id = b.id) AND EXISTS (SELECT 1 FROM business_categories bc WHERE bc.business_id = b.id)");
    }

    if (options.city) {
      where.push("b.city LIKE ?");
      binds.push("%" + options.city + "%");
    }

    if (options.area) {
      where.push("(b.area LIKE ? OR EXISTS (SELECT 1 FROM business_service_areas bsa WHERE bsa.business_id = b.id AND bsa.area LIKE ?))");
      binds.push("%" + options.area + "%", "%" + options.area + "%");
    }

    if (options.location) {
      where.push("(b.city LIKE ? OR b.area LIKE ? OR EXISTS (SELECT 1 FROM business_service_areas bsa2 WHERE bsa2.business_id = b.id AND bsa2.area LIKE ?))");
      const locationValue = "%" + options.location + "%";
      binds.push(locationValue, locationValue, locationValue);
    }

    if (options.query) {
      where.push(
        "(b.name LIKE ? OR b.description LIKE ? OR EXISTS (SELECT 1 FROM business_services bs2 JOIN services s2 ON s2.id = bs2.service_id WHERE bs2.business_id = b.id AND REPLACE(REPLACE(s2.name, '‌', ''), ' ', '') LIKE ?) OR EXISTS (SELECT 1 FROM business_categories bcq JOIN categories cq ON cq.id = bcq.category_id WHERE bcq.business_id = b.id AND cq.name LIKE ?))"
      );
      const value = "%" + options.query + "%";
      binds.push(value, value, "%" + options.query.replace(/[\s\u200c]+/g, "") + "%", value);
    }

    const limit = Math.max(1, Math.min(Number(options.limit || 50), 100));
    const sql =
      "SELECT DISTINCT b.*, c.slug AS category_slug, c.name AS category_name FROM businesses b LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id WHERE " +
      where.join(" AND ") +
      " ORDER BY (SELECT (COALESCE(SUM(r.rating),0) + 15.0) / (COUNT(*) + 5.0) FROM reviews r WHERE r.business_id = b.id AND r.status = 'published') DESC, b.id DESC LIMIT " +
      limit;

    const rows = await db.prepare(sql).bind(...binds).all();
    return hydrate(rows?.results || []);
  } catch (error) {
    console.warn("public business list failed", error);
    return [];
  }
}


export async function getBusinessSlugRedirect(oldSlug: string): Promise<string | null> {
  try {
    const db = getDb();
    if (!db) return null;

    const row = await db
      .prepare(
        "SELECT b.slug FROM business_slug_history h JOIN businesses b ON b.id = h.business_id WHERE h.old_slug = ? LIMIT 1"
      )
      .bind(oldSlug)
      .first();

    return row?.slug ? String(row.slug) : null;
  } catch {
    return null;
  }
}

