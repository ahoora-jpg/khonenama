import { normalizePlanCode, planPresentation } from "@/lib/business-entitlements";
import { ensureBusinessMediaSchema, getOwnedBusiness } from "@/lib/server/business-media";
import {
  deleteImageKitFile,
  getImageKitFileDetails,
  imageKitServerConfigured,
  uploadImageKitFile,
} from "@/lib/server/imagekit";

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

  if (!imageKitServerConfigured()) {
    return Response.json({ ok: false, error: "IMAGEKIT_NOT_CONFIGURED" }, { status: 503 });
  }

  await ensureBusinessMediaSchema(owned.db);

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

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

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

  try {
    const uploaded = await uploadImageKitFile(file, {
      fileName: safeFileName(file.name),
      folder,
      tags: "khonenama,business-gallery",
    });
    uploadedFileId = uploaded.fileId;

    const verified = await getImageKitFileDetails(uploaded.fileId);
    const expectedFolder = folder + "/";

    if (
      verified.fileId !== uploaded.fileId ||
      !verified.filePath.startsWith(expectedFolder) ||
      verified.fileType !== "image" ||
      !ALLOWED_IMAGE_MIME.has(verified.mime) ||
      !Number.isFinite(verified.size) ||
      verified.size < 1 ||
      verified.size > MAX_MEDIA_BYTES ||
      !verified.url
    ) {
      await deleteImageKitFile(uploaded.fileId).catch(() => {});
      return Response.json({ ok: false, error: "INVALID_MEDIA" }, { status: 400 });
    }

    const duplicate = await owned.db
      .prepare(
        "SELECT id FROM business_media WHERE business_id = ? AND provider_file_id = ? LIMIT 1"
      )
      .bind(owned.business.id, uploaded.fileId)
      .first();

    if (duplicate?.id) {
      await deleteImageKitFile(uploaded.fileId).catch(() => {});
      return Response.json({ ok: false, error: "MEDIA_ALREADY_REGISTERED" }, { status: 409 });
    }

    const kind = currentCount === 0 ? "cover" : "image";
    const inserted = await owned.db
      .prepare(
        "INSERT INTO business_media " +
          "(business_id, kind, storage_key, alt_text, sort_order, provider, provider_file_id, file_url, file_path, thumbnail_url) " +
          "VALUES (?, ?, ?, NULL, ?, 'imagekit', ?, ?, ?, NULLIF(?, '')) RETURNING id"
      )
      .bind(
        owned.business.id,
        kind,
        uploaded.fileId,
        currentCount + 1,
        uploaded.fileId,
        verified.url,
        verified.filePath,
        verified.thumbnailUrl
      )
      .first();

    if (!inserted?.id) {
      throw new Error("MEDIA_INSERT_FAILED");
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
      await deleteImageKitFile(uploadedFileId).catch(() => {});
    }

    const message = error instanceof Error ? error.message : "";
    console.error("server media upload failed", error);

    if (message.startsWith("IMAGEKIT_UPLOAD_FAILED:")) {
      return Response.json({ ok: false, error: "IMAGEKIT_UPLOAD_FAILED" }, { status: 502 });
    }
    if (message === "IMAGEKIT_NOT_CONFIGURED") {
      return Response.json({ ok: false, error: "IMAGEKIT_NOT_CONFIGURED" }, { status: 503 });
    }
    return Response.json({ ok: false, error: "MEDIA_UPLOAD_FAILED" }, { status: 500 });
  }
}
