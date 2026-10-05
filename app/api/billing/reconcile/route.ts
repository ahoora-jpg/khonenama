import { env } from "cloudflare:workers";
import { getOwnedBusiness } from "@/lib/server/business-media";
import { BillingError, billingHeaders, verifyCheckout } from "@/lib/server/billing";
import { paymentProvider } from "@/lib/server/payment-provider";
export async function POST(request: Request) {
  const owner = await getOwnedBusiness(request);
  if (!owner) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string" || body.id.length > 50) return Response.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  try {
    const row = await owner.db.prepare("SELECT id FROM billing_checkouts WHERE id=? AND business_id=?").bind(body.id, owner.business.id).first();
    if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ ok: true, status: await verifyCheckout(owner.db, body.id, paymentProvider(env as any)) }, { headers: billingHeaders });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof BillingError ? error.code : "PAYMENT_RETRY_REQUIRED" }, { status: error instanceof BillingError ? error.status : 503, headers: billingHeaders });
  }
}
