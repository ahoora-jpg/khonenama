import QRCode from "qrcode";
import { getOwnedBusiness } from "@/lib/server/business-media";

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const url = "https://khonenama.ir/g/" + owned.business.id;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 4, width: 512 });
  return new Response(svg, { headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Content-Disposition": 'inline; filename="khonenama-gallery-' + owned.business.id + '.svg"',
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  } });
}
