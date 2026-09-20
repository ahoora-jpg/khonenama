import { env } from "cloudflare:workers";

export type PublicBusiness = {
  id: number;
  slug: string;
  name: string;
  description: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  status: string;
  verificationStatus: string;
  featured: boolean;
  category: string;
  categoryName: string;
  categories: { slug: string; name: string; primary: boolean }[];
  services: string[];
  rating: number;
  reviewCount: number;
};

function getDb() {
  return (env as any).DB;
}

async function hydrate(rows: any[]): Promise<PublicBusiness[]> {
  const db = getDb();
  if (!db || !rows.length) return [];

  const result: PublicBusiness[] = [];
  for (const row of rows) {
    const [servicesResult, categoriesResult, reviewResult] = await Promise.all([
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
      rating: Number(reviewResult?.rating || 0),
      reviewCount: Number(reviewResult?.review_count || 0),
    });
  }

  return result;
}

export async function getPublishedBusiness(slug: string): Promise<PublicBusiness | null> {
  try {
    const db = getDb();
    if (!db) return null;

    const row = await db
      .prepare(
        "SELECT b.*, c.slug AS category_slug, c.name AS category_name FROM businesses b LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id WHERE b.slug = ? AND b.status = 'published' LIMIT 1"
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
  city?: string;
  area?: string;
  query?: string;
  limit?: number;
} = {}): Promise<PublicBusiness[]> {
  try {
    const db = getDb();
    if (!db) return [];

    const where = ["b.status = 'published'"];
    const binds: any[] = [];

    if (options.categorySlug) {
      where.push(
        "EXISTS (SELECT 1 FROM business_categories bcx JOIN categories cx ON cx.id = bcx.category_id WHERE bcx.business_id = b.id AND cx.slug = ?)"
      );
      binds.push(options.categorySlug);
    }

    if (options.city) {
      where.push("b.city LIKE ?");
      binds.push("%" + options.city + "%");
    }

    if (options.area) {
      where.push("(b.area LIKE ? OR EXISTS (SELECT 1 FROM business_service_areas bsa WHERE bsa.business_id = b.id AND bsa.area LIKE ?))");
      binds.push("%" + options.area + "%", "%" + options.area + "%");
    }

    if (options.query) {
      where.push(
        "(b.name LIKE ? OR b.description LIKE ? OR EXISTS (SELECT 1 FROM business_services bs2 JOIN services s2 ON s2.id = bs2.service_id WHERE bs2.business_id = b.id AND s2.name LIKE ?))"
      );
      const value = "%" + options.query + "%";
      binds.push(value, value, value);
    }

    const limit = Math.max(1, Math.min(Number(options.limit || 50), 100));
    const sql =
      "SELECT DISTINCT b.*, c.slug AS category_slug, c.name AS category_name FROM businesses b LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id WHERE " +
      where.join(" AND ") +
      " ORDER BY b.is_featured DESC, b.updated_at DESC, b.id DESC LIMIT " +
      limit;

    const rows = await db.prepare(sql).bind(...binds).all();
    return hydrate(rows?.results || []);
  } catch (error) {
    console.warn("public business list failed", error);
    return [];
  }
}
