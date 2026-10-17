import QRCode from "qrcode";
import { getOwnedBusiness } from "@/lib/server/business-media";
import { promotionLink, promotionSubscription, storyTemplateCount } from "@/lib/server/business-promotion";

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const subscription = await promotionSubscription(owned.db, owned.business.id);
  if (!storyTemplateCount(subscription?.code)) return Response.json({ok:false,error:"PAID_PLAN_REQUIRED"},{status:403,headers:{"Cache-Control":"no-store"}});
  const url = await promotionLink(owned.db, owned.business.id, subscription);
  if (!url) return Response.json({ok:false,error:"PROMOTION_EXPIRED"},{status:403,headers:{"Cache-Control":"no-store"}});
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 4, width: 512 });
  return new Response(svg, { headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Content-Disposition": 'inline; filename="khonenama-gallery-' + owned.business.id + '.svg"',
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  } });
}
