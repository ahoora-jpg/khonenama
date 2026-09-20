import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { createUniqueBusinessSlug } from "@/lib/business-slug";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const businessId = Number(id);
  if (!Number.isInteger(businessId) || businessId < 1) {
    return Response.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  const db = (env as any).DB;

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_slug_history (old_slug TEXT PRIMARY KEY, business_id INTEGER NOT NULL, replaced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE)"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_business_slug_history_business ON business_slug_history(business_id, replaced_at)"
  ).run();

  const business = await db
    .prepare("SELECT id, slug, name, city FROM businesses WHERE id = ? LIMIT 1")
    .bind(businessId)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  const slug = await createUniqueBusinessSlug(
    db,
    String(business.name || "business"),
    String(business.city || "")
  );

  if (slug === business.slug) {
    return Response.json({
      ok: true,
      slug,
      publicUrl: "https://khonenama.ir/business/" + slug,
      unchanged: true,
    });
  }

  await db.batch([
    db
      .prepare("INSERT OR IGNORE INTO business_slug_history (old_slug, business_id) VALUES (?, ?)")
      .bind(business.slug, businessId),
    db
      .prepare("UPDATE businesses SET slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(slug, businessId),
  ]);

  return Response.json({
    ok: true,
    slug,
    oldSlug: business.slug,
    publicUrl: "https://khonenama.ir/business/" + slug,
  });
}
