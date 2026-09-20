import { createImageKitUploadAuth, imageKitConfigured } from "@/lib/server/imagekit";
import { getOwnedBusiness } from "@/lib/server/business-media";

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (!imageKitConfigured()) {
    return Response.json({ ok: false, error: "IMAGEKIT_NOT_CONFIGURED" }, { status: 503 });
  }

  const auth = await createImageKitUploadAuth();
  return Response.json({
    ok: true,
    ...auth,
    folder: "/khonenama/businesses/" + owned.business.id,
  });
}
