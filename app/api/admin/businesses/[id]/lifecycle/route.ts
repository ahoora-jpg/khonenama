import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { ensureBusinessMediaSchema } from "@/lib/server/business-media";
import { deleteStoredBusinessImage } from "@/lib/server/business-media-storage";

async function ensureAuditTable(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_admin_actions (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "business_id INTEGER," +
      "business_name TEXT," +
      "business_slug TEXT," +
      "action TEXT NOT NULL," +
      "previous_status TEXT," +
      "reason TEXT," +
      "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ")"
  ).run();

  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_business_admin_actions_business ON business_admin_actions(business_id, created_at)"
  ).run();
}

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

  const body = await request.json().catch(() => ({}));
  const action =
    body?.action === "remove" ? "remove" :
    body?.action === "restore" ? "restore" :
    body?.action === "purge" ? "purge" : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 700) : "";

  if (!action) {
    return Response.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
  }

  const db = (env as any).DB;
  await ensureAuditTable(db);

  const business = await db
    .prepare("SELECT id, name, slug, status FROM businesses WHERE id = ? LIMIT 1")
    .bind(businessId)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  if (action === "remove") {
    if (business.status === "suspended") return Response.json({ ok: true, status: "suspended", unchanged: true });
    await db.batch([
      db
        .prepare(
          "INSERT INTO business_admin_actions (business_id, business_name, business_slug, action, previous_status, reason) VALUES (?, ?, ?, 'remove', ?, NULLIF(?, ''))"
        )
        .bind(businessId, business.name, business.slug, business.status, reason),
      db
        .prepare("UPDATE businesses SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(businessId),
    ]);

    return Response.json({ ok: true, status: "suspended", action: "remove" });
  }

  if (action === "restore") {
    if (business.status !== "suspended") return Response.json({ ok: true, status: business.status, unchanged: true });
    const previous = await db
      .prepare(
        "SELECT previous_status FROM business_admin_actions WHERE business_id = ? AND action = 'remove' ORDER BY id DESC LIMIT 1"
      )
      .bind(businessId)
      .first();

    const restoreStatus =
      previous?.previous_status === "draft" || previous?.previous_status === "pending"
        ? String(previous.previous_status)
        : "published";

    await db.batch([
      db
        .prepare(
          "INSERT INTO business_admin_actions (business_id, business_name, business_slug, action, previous_status, reason) VALUES (?, ?, ?, 'restore', ?, NULLIF(?, ''))"
        )
        .bind(businessId, business.name, business.slug, business.status, reason),
      db
        .prepare("UPDATE businesses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(restoreStatus, businessId),
    ]);

    return Response.json({ ok: true, status: restoreStatus, action: "restore" });
  }

  if (business.status !== "suspended") {
    return Response.json({ ok: false, error: "REMOVE_BEFORE_PURGE" }, { status: 409 });
  }
  if (body?.confirmationName !== business.name) {
    return Response.json({ ok: false, error: "CONFIRMATION_REQUIRED" }, { status: 400 });
  }
  const invoiceCount = await db
    .prepare("SELECT COUNT(*) AS count FROM invoices WHERE business_id = ?")
    .bind(businessId)
    .first();

  if (Number(invoiceCount?.count || 0) > 0) {
    return Response.json(
      {
        ok: false,
        error: "FINANCIAL_RECORDS_MUST_BE_RETAINED",
        message: "Business has financial records and cannot be physically purged.",
      },
      { status: 409 }
    );
  }

  await ensureBusinessMediaSchema(db);
  const media = await db.prepare("SELECT provider, provider_file_id, storage_key FROM business_media WHERE business_id = ?").bind(businessId).all();
  try {
    for (const image of media.results || []) {
      const fileId = String(image.provider_file_id || image.storage_key || "");
      if (fileId) await deleteStoredBusinessImage(String(image.provider || "imagekit"), fileId);
    }
  } catch {
    return Response.json({ ok: false, error: "MEDIA_CLEANUP_FAILED" }, { status: 502 });
  }
  const deletion = await db.batch([db
    .prepare(
      "INSERT INTO business_admin_actions (business_id, business_name, business_slug, action, previous_status, reason) VALUES (?, ?, ?, 'purge', ?, NULLIF(?, ''))"
    )
    .bind(businessId, business.name, business.slug, business.status, reason),
    db.prepare("DELETE FROM businesses WHERE id = ? AND status = 'suspended'").bind(businessId),
  ]);
  if (!deletion[1]?.meta?.changes) {
    return Response.json({ ok: false, error: "BUSINESS_CHANGED" }, { status: 409 });
  }

  return Response.json({ ok: true, action: "purge", deleted: true });
}
