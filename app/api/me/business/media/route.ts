import { normalizePlanCode, planPresentation } from "@/lib/business-entitlements";
import { getOwnedBusiness, ensureBusinessMediaSchema } from "@/lib/server/business-media";
import { deleteImageKitFile, imageKitConfigured } from "@/lib/server/imagekit";

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function getGalleryLimit(db: any, businessId: number) {
  const planRow = await db
    .prepare(
      "SELECT p.code FROM subscriptions s JOIN plans p ON p.id = s.plan_id " +
        "WHERE s.business_id = ? AND s.status = 'active' " +
        "AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) " +
        "ORDER BY s.id DESC LIMIT 1"
    )
    .bind(businessId)
    .first();

  const planCode = normalizePlanCode(planRow?.code);
  return planPresentation[planCode].galleryLimit;
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureBusinessMediaSchema(owned.db);

  const rows = await owned.db
    .prepare(
      "SELECT id, kind, storage_key, alt_text, sort_order, provider, provider_file_id, file_url, file_path, thumbnail_url, created_at " +
      "FROM business_media WHERE business_id = ? ORDER BY CASE kind WHEN 'cover' THEN 0 WHEN 'logo' THEN 1 ELSE 2 END, sort_order, id"
    )
    .bind(owned.business.id)
    .all();

  return Response.json({
    ok: true,
    configured: imageKitConfigured(),
    media: rows?.results || [],
  });
}

export async function POST(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureBusinessMediaSchema(owned.db);

  const body = await request.json().catch(() => ({}));
  const providerFileId = cleanText(body?.fileId, 220);
  const fileUrl = cleanText(body?.url, 1200);
  const filePath = cleanText(body?.filePath, 700);
  const thumbnailUrl = cleanText(body?.thumbnailUrl, 1200);
  const altText = cleanText(body?.altText, 300);
  const kind = body?.kind === "logo" || body?.kind === "cover" ? body.kind : "image";

  if (!providerFileId || !fileUrl || !filePath) {
    return Response.json({ ok: false, error: "INVALID_MEDIA" }, { status: 400 });
  }

  const [countRow, galleryLimit] = await Promise.all([
    owned.db
      .prepare("SELECT COUNT(*) AS count FROM business_media WHERE business_id = ?")
      .bind(owned.business.id)
      .first(),
    getGalleryLimit(owned.db, Number(owned.business.id)),
  ]);

  const currentCount = Number(countRow?.count || 0);
  if (currentCount >= galleryLimit) {
    return Response.json(
      { ok: false, error: "GALLERY_LIMIT_REACHED", limit: galleryLimit },
      { status: 409 }
    );
  }

  const sortOrder = currentCount + 1;

  if (kind === "cover") {
    await owned.db
      .prepare("UPDATE business_media SET kind = 'image' WHERE business_id = ? AND kind = 'cover'")
      .bind(owned.business.id)
      .run();
  }

  const inserted = await owned.db
    .prepare(
      "INSERT INTO business_media " +
      "(business_id, kind, storage_key, alt_text, sort_order, provider, provider_file_id, file_url, file_path, thumbnail_url) " +
      "VALUES (?, ?, ?, NULLIF(?, ''), ?, 'imagekit', ?, ?, ?, NULLIF(?, '')) RETURNING id"
    )
    .bind(
      owned.business.id,
      kind,
      providerFileId,
      altText,
      sortOrder,
      providerFileId,
      fileUrl,
      filePath,
      thumbnailUrl
    )
    .first();

  return Response.json({ ok: true, id: inserted?.id });
}

export async function PATCH(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureBusinessMediaSchema(owned.db);

  const body = await request.json().catch(() => ({}));
  const mediaId = Number(body?.id);
  const action = typeof body?.action === "string" ? body.action : "";

  if (!Number.isInteger(mediaId) || mediaId < 1) {
    return Response.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  const media = await owned.db
    .prepare("SELECT id, kind, sort_order FROM business_media WHERE id = ? AND business_id = ? LIMIT 1")
    .bind(mediaId, owned.business.id)
    .first();

  if (!media?.id) {
    return Response.json({ ok: false, error: "MEDIA_NOT_FOUND" }, { status: 404 });
  }

  if (action === "cover") {
    await owned.db.batch([
      owned.db
        .prepare("UPDATE business_media SET kind = 'image' WHERE business_id = ? AND kind = 'cover'")
        .bind(owned.business.id),
      owned.db
        .prepare("UPDATE business_media SET kind = 'cover' WHERE id = ? AND business_id = ?")
        .bind(mediaId, owned.business.id),
    ]);
    return Response.json({ ok: true });
  }

  if (action === "alt") {
    const altText = cleanText(body?.altText, 300);
    await owned.db
      .prepare("UPDATE business_media SET alt_text = NULLIF(?, '') WHERE id = ? AND business_id = ?")
      .bind(altText, mediaId, owned.business.id)
      .run();
    return Response.json({ ok: true });
  }

  if (action === "move-up" || action === "move-down") {
    const operator = action === "move-up" ? "<" : ">";
    const direction = action === "move-up" ? "DESC" : "ASC";

    const neighbor = await owned.db
      .prepare(
        "SELECT id, sort_order FROM business_media WHERE business_id = ? AND sort_order " +
        operator +
        " ? ORDER BY sort_order " +
        direction +
        " LIMIT 1"
      )
      .bind(owned.business.id, media.sort_order)
      .first();

    if (neighbor?.id) {
      await owned.db.batch([
        owned.db
          .prepare("UPDATE business_media SET sort_order = ? WHERE id = ? AND business_id = ?")
          .bind(neighbor.sort_order, mediaId, owned.business.id),
        owned.db
          .prepare("UPDATE business_media SET sort_order = ? WHERE id = ? AND business_id = ?")
          .bind(media.sort_order, neighbor.id, owned.business.id),
      ]);
    }

    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureBusinessMediaSchema(owned.db);

  const body = await request.json().catch(() => ({}));
  const mediaId = Number(body?.id);
  if (!Number.isInteger(mediaId) || mediaId < 1) {
    return Response.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  const media = await owned.db
    .prepare(
      "SELECT id, provider_file_id, storage_key FROM business_media WHERE id = ? AND business_id = ? LIMIT 1"
    )
    .bind(mediaId, owned.business.id)
    .first();

  if (!media?.id) {
    return Response.json({ ok: false, error: "MEDIA_NOT_FOUND" }, { status: 404 });
  }

  const fileId = String(media.provider_file_id || media.storage_key || "");
  if (fileId) await deleteImageKitFile(fileId);

  await owned.db
    .prepare("DELETE FROM business_media WHERE id = ? AND business_id = ?")
    .bind(mediaId, owned.business.id)
    .run();

  return Response.json({ ok: true });
}
