import { env } from "cloudflare:workers";
import { crossSiteMutation } from "@/lib/request-security";
import { sellerAcquisitionEvent } from "@/lib/seller-acquisition-events";
import { recordConversion, recordSellerSource, sellerSource } from "@/lib/server/conversion-metrics";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
export async function POST(request: Request) {
  if (crossSiteMutation(request)) return Response.json({ ok: false }, { status: 403, headers });
  try {
    const body = await request.json();
    const event = sellerAcquisitionEvent(body?.event);
    if (!event || Object.keys(body).some(key => key !== "event" && key !== "source") || (body.source !== undefined && !sellerSource(body.source))) return Response.json({ ok: false }, { status: 400, headers });
    const db = (env as any).DB;
    if (!db || !(await recordConversion(db, event))) return Response.json({ ok: false }, { status: 503, headers });
    // Older seller pages send the aggregate event without a route source.
    // Keep that privacy-safe metric working; contextual invitations additionally
    // persist their validated source for the acquisition report.
    if (body.source !== undefined && !(await recordSellerSource(db, event, body.source))) {
      return Response.json({ ok: false }, { status: 503, headers });
    }
    return new Response(null, { status: 204, headers });
  } catch { return Response.json({ ok: false }, { status: 400, headers }); }
}
