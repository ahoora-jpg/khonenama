import { normalizePlanCode, planPresentation } from "@/lib/business-entitlements";
import { ensureBusinessMediaSchema, getOwnedBusiness } from "@/lib/server/business-media";
import { readBusinessUploadForm } from "@/lib/server/business-upload-form";
import {
  deleteStoredBusinessImage,
  mediaStorageConfigured,
  uploadStoredBusinessImage,
} from "@/lib/server/business-media-storage";

const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function safeFileName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 160);
  return cleaned || "business-image.jpg";
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

export async function POST(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (!mediaStorageConfigured()) {
    return Response.json({ ok: false, error: "MEDIA_STORAGE_NOT_CONFIGURED" }, { status: 503 });
  }

  await ensureBusinessMediaSchema(owned.db);

  let form: FormData;
  try {
    form = await readBusinessUploadForm(request);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "FILE_TOO_LARGE";
    return Response.json({ ok: false, error: tooLarge ? "FILE_TOO_LARGE" : "INVALID_FILE" }, { status: tooLarge ? 413 : 400 });
  }
  const kind = form.get("kind") === "cover" || form.get("kind") === "logo" ? String(form.get("kind")) : "image";
  const [countRow, galleryLimit] = await Promise.all([
    owned.db
      .prepare("SELECT COUNT(*) AS count FROM business_media WHERE business_id = ? AND kind = ?")
      .bind(owned.business.id, kind)
      .first(),
    getGalleryLimit(owned.db, Number(owned.business.id)),
  ]);

  const currentCount = Number(countRow?.count || 0);
  const slotLimit = kind === "image" ? galleryLimit : 1;
  if (currentCount >= slotLimit) {
    return Response.json(
      { ok: false, error: "GALLERY_LIMIT_REACHED", limit: galleryLimit },
      { status: 409 }
    );
  }

  const file = form.get("file");

  if (!(file instanceof File) || file.size < 1) {
    return Response.json({ ok: false, error: "INVALID_FILE" }, { status: 400 });
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return Response.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 413 });
  }
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return Response.json({ ok: false, error: "INVALID_FILE_TYPE" }, { status: 415 });
  }

  const folder = "/khonenama/businesses/" + owned.business.id;
  let uploadedFileId = "";
  let uploadedProvider = "imagekit";

  try {
    const verified = await uploadStoredBusinessImage(file, {
      fileName: safeFileName(file.name),
      folder,
      tags: "khonenama,business-gallery",
      businessId: Number(owned.business.id),
    });
    uploadedFileId = verified.fileId;
    uploadedProvider = verified.provider;

    const duplicate = await owned.db
      .prepare(
        "SELECT id FROM business_media WHERE business_id = ? AND provider_file_id = ? LIMIT 1"
      )
      .bind(owned.business.id, verified.fileId)
      .first();

    if (duplicate?.id) {
      await deleteStoredBusinessImage(uploadedProvider, uploadedFileId).catch(() => {});
      return Response.json({ ok: false, error: "MEDIA_ALREADY_REGISTERED" }, { status: 409 });
    }


    const inserted = await owned.db
      .prepare(
        "INSERT INTO business_media " +
          "(business_id, kind, storage_key, alt_text, sort_order, provider, provider_file_id, file_url, file_path, thumbnail_url) " +
          "SELECT ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULLIF(?, '') WHERE (SELECT COUNT(*) FROM business_media WHERE business_id = ? AND kind = ?) < ? AND NOT EXISTS (SELECT 1 FROM business_media WHERE business_id = ? AND provider_file_id = ?) RETURNING id"
      )
      .bind(
        owned.business.id,
        kind,
        verified.fileId,
        currentCount + 1,
        uploadedProvider,
        verified.fileId,
        verified.url,
        verified.filePath,
        verified.thumbnailUrl,
        owned.business.id,
        kind,
        slotLimit,
        owned.business.id,
        verified.fileId
      )
      .first();

    if (!inserted?.id) {
      await deleteStoredBusinessImage(uploadedProvider, uploadedFileId).catch(() => {});
      return Response.json({ ok: false, error: "GALLERY_LIMIT_REACHED", limit: galleryLimit }, { status: 409 });
    }

    return Response.json(
      {
        ok: true,
        id: inserted.id,
        media: {
          id: inserted.id,
          kind,
          fileUrl: verified.url,
          thumbnailUrl: verified.thumbnailUrl,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (uploadedFileId) {
      await deleteStoredBusinessImage(uploadedProvider, uploadedFileId).catch(() => {});
    }

    const message = error instanceof Error ? error.message : "";
    console.error("server media upload failed", error);

    if (message.startsWith("IMAGEKIT_UPLOAD_FAILED:")) {
      return Response.json({ ok: false, error: "IMAGEKIT_UPLOAD_FAILED" }, { status: 502 });
    }
    if (message === "IMAGEKIT_NOT_CONFIGURED") {
      return Response.json({ ok: false, error: "IMAGEKIT_NOT_CONFIGURED" }, { status: 503 });
    }
    if (message === "MEDIA_STORAGE_NOT_CONFIGURED") {
      return Response.json({ ok: false, error: message }, { status: 503 });
    }
    if (message === "INVALID_MEDIA" || message === "MEDIA_PROCESSING_FAILED") {
      return Response.json({ ok: false, error: "MEDIA_PROCESSING_FAILED" }, { status: 422 });
    }
    return Response.json({ ok: false, error: "MEDIA_UPLOAD_FAILED" }, { status: 500 });
  }
}
