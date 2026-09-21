import { normalizePlanCode, planPresentation } from "@/lib/business-entitlements";
import { ensureBusinessMediaSchema, getOwnedBusiness } from "@/lib/server/business-media";
import { createImageKitUploadAuth, imageKitConfigured } from "@/lib/server/imagekit";

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (!imageKitConfigured()) {
    return Response.json({ ok: false, error: "IMAGEKIT_NOT_CONFIGURED" }, { status: 503 });
  }

  await ensureBusinessMediaSchema(owned.db);

  const [countRow, planRow] = await Promise.all([
    owned.db
      .prepare("SELECT COUNT(*) AS count FROM business_media WHERE business_id = ?")
      .bind(owned.business.id)
      .first(),
    owned.db
      .prepare(
        "SELECT p.code FROM subscriptions s JOIN plans p ON p.id = s.plan_id " +
          "WHERE s.business_id = ? AND s.status = 'active' " +
          "AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) " +
          "ORDER BY s.id DESC LIMIT 1"
      )
      .bind(owned.business.id)
      .first(),
  ]);

  const planCode = normalizePlanCode(planRow?.code);
  const galleryLimit = planPresentation[planCode].galleryLimit;
  const currentCount = Number(countRow?.count || 0);

  if (currentCount >= galleryLimit) {
    return Response.json(
      { ok: false, error: "GALLERY_LIMIT_REACHED", limit: galleryLimit },
      { status: 409 }
    );
  }

  const auth = await createImageKitUploadAuth();
  return Response.json({
    ok: true,
    ...auth,
    folder: "/khonenama/businesses/" + owned.business.id,
    galleryLimit,
    remaining: Math.max(0, galleryLimit - currentCount),
  });
}
