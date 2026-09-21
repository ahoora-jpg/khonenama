import { getOwnedBusiness } from "@/lib/server/business-media";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORY_BY_SLUG,
  isBusinessCategorySlug,
  servicesForCategories,
  categoryForService,
} from "@/lib/business-taxonomy";

function serviceSlug(category: string, service: string) {
  const list = BUSINESS_CATEGORY_BY_SLUG[category as keyof typeof BUSINESS_CATEGORY_BY_SLUG]?.services || [];
  const index = list.indexOf(service);
  return category + "-" + String(Math.max(index, 0) + 1).padStart(2, "0");
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const [categoriesResult, servicesResult] = await Promise.all([
    owned.db
      .prepare(
        "SELECT c.slug FROM business_categories bc JOIN categories c ON c.id = bc.category_id WHERE bc.business_id = ? ORDER BY bc.is_primary DESC, c.sort_order"
      )
      .bind(owned.business.id)
      .all(),
    owned.db
      .prepare(
        "SELECT s.name FROM business_services bs JOIN services s ON s.id = bs.service_id WHERE bs.business_id = ? ORDER BY s.id"
      )
      .bind(owned.business.id)
      .all(),
  ]);

  return Response.json({
    ok: true,
    categories: (categoriesResult?.results || []).map((row: any) => row.slug),
    services: (servicesResult?.results || []).map((row: any) => row.name),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawCategories: unknown[] = Array.isArray(body?.categories) ? body.categories : [];
  const categories = Array.from(
    new Set<string>(
      rawCategories.filter(
        (item): item is string => typeof item === "string" && isBusinessCategorySlug(item)
      )
    )
  );

  const allowed = new Set<string>(servicesForCategories(categories));
  const rawServices: unknown[] = Array.isArray(body?.services) ? body.services : [];
  const services = Array.from(
    new Set<string>(
      rawServices.filter(
        (item): item is string => typeof item === "string" && allowed.has(item)
      )
    )
  );

  if (!categories.length || !services.length) {
    return Response.json({ ok: false, error: "INCOMPLETE_SELECTION" }, { status: 400 });
  }

  await owned.db.batch(
    BUSINESS_CATEGORIES.map((item, index) =>
      owned.db
        .prepare("INSERT OR IGNORE INTO categories (slug, name, sort_order, is_active) VALUES (?, ?, ?, 1)")
        .bind(item.slug, item.label, (index + 1) * 10)
    )
  );

  const placeholders = categories.map(() => "?").join(",");
  const categoryRowsResult = await owned.db
    .prepare("SELECT id, slug FROM categories WHERE slug IN (" + placeholders + ")")
    .bind(...categories)
    .all();

  const categoryRows = categoryRowsResult?.results || [];
  const ids = new Map<string, number>(
    categoryRows.map((row: any) => [String(row.slug), Number(row.id)])
  );

  if (ids.size !== categories.length) {
    return Response.json({ ok: false, error: "CATEGORY_SYNC_FAILED" }, { status: 409 });
  }

  const statements:any[] = [
    owned.db.prepare("DELETE FROM business_services WHERE business_id = ?").bind(owned.business.id),
    owned.db.prepare("DELETE FROM business_categories WHERE business_id = ?").bind(owned.business.id),
  ];

  categories.forEach((slug, index) => {
    statements.push(
      owned.db
        .prepare("INSERT INTO business_categories (business_id, category_id, is_primary) VALUES (?, ?, ?)")
        .bind(owned.business.id, ids.get(slug), index === 0 ? 1 : 0)
    );
  });

  await owned.db.batch(statements);

  for (const service of services) {
    const categorySlug = categoryForService(service, categories);
    if (!categorySlug) continue;
    const categoryId = ids.get(categorySlug);
    const slug = serviceSlug(categorySlug, service);

    await owned.db
      .prepare("INSERT OR IGNORE INTO services (slug, name, category_id) VALUES (?, ?, ?)")
      .bind(slug, service, categoryId)
      .run();

    await owned.db
      .prepare(
        "INSERT OR IGNORE INTO business_services (business_id, service_id) SELECT ?, id FROM services WHERE slug = ?"
      )
      .bind(owned.business.id, slug)
      .run();
  }

  return Response.json({ ok: true, categories, services });
}
