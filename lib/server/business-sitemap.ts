import { env } from "cloudflare:workers";

export type BusinessSitemapEntry = {
  slug: string;
  updatedAt: string;
  planCode: "free" | "pro" | "premium";
};

const INTERNAL_TEST_BUSINESS_SLUGS = ["alayy-dkvr-krj"];
const BATCH_SIZE = 500;
const MAX_BUSINESS_URLS = 49000;

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

/**
 * Lightweight sitemap-only lookup.
 *
 * Do not use the public business hydrator here: that loads services, media,
 * reviews, hours and plans per business and used to cap the sitemap at 100
 * profiles. This query only returns fields needed by sitemap.xml and pages
 * through published, sufficiently complete profiles in batches.
 */
export async function listPublishedBusinessSitemapEntries(): Promise<BusinessSitemapEntry[]> {
  try {
    const db = getDb();
    if (!db) return [];

    await ensureVisibilitySchema(db);

    const entries: BusinessSitemapEntry[] = [];
    let offset = 0;

    while (entries.length < MAX_BUSINESS_URLS) {
      const remaining = MAX_BUSINESS_URLS - entries.length;
      const batchLimit = Math.min(BATCH_SIZE, remaining);
      const placeholders = INTERNAL_TEST_BUSINESS_SLUGS.map(() => "?").join(",");

      const sql =
        "SELECT b.slug, b.updated_at, " +
        "COALESCE((SELECT p.code FROM subscriptions s " +
        "JOIN plans p ON p.id = s.plan_id " +
        "WHERE s.business_id = b.id AND s.status = 'active' " +
        "AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) " +
        "ORDER BY s.id DESC LIMIT 1), 'free') AS plan_code " +
        "FROM businesses b " +
        "WHERE b.status = 'published' " +
        "AND length(trim(COALESCE(b.slug, ''))) > 2 " +
        "AND length(trim(COALESCE(b.name, ''))) >= 2 " +
        "AND length(trim(COALESCE(b.description, ''))) >= 20 " +
        "AND length(trim(COALESCE(b.city, ''))) >= 2 " +
        "AND EXISTS (SELECT 1 FROM business_categories bc WHERE bc.business_id = b.id) " +
        "AND EXISTS (SELECT 1 FROM business_services bs WHERE bs.business_id = b.id) " +
        "AND EXISTS (SELECT 1 FROM business_service_areas bsa WHERE bsa.business_id = b.id) " +
        "AND NOT EXISTS (SELECT 1 FROM business_visibility_controls bvc " +
        "WHERE bvc.business_id = b.id AND bvc.owner_paused = 1) " +
        (INTERNAL_TEST_BUSINESS_SLUGS.length
          ? "AND b.slug NOT IN (" + placeholders + ") "
          : "") +
        "ORDER BY b.updated_at DESC, b.id DESC " +
        "LIMIT ? OFFSET ?";

      const binds = [
        ...INTERNAL_TEST_BUSINESS_SLUGS,
        batchLimit,
        offset,
      ];

      const result = await db.prepare(sql).bind(...binds).all();
      const rows = result?.results || [];

      for (const row of rows) {
        entries.push({
          slug: String(row.slug),
          updatedAt: row.updated_at ? String(row.updated_at) : "",
          planCode:
            row.plan_code === "premium"
              ? "premium"
              : row.plan_code === "pro"
                ? "pro"
                : "free",
        });
      }

      if (rows.length < batchLimit) break;
      offset += rows.length;
    }

    return entries;
  } catch (error) {
    console.warn("business sitemap lookup failed", error);
    return [];
  }
}
