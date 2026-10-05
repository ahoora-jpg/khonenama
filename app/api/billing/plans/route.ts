import { env } from "cloudflare:workers";
import { billingCatalog, billingHeaders } from "@/lib/server/billing";
import { paymentProvider } from "@/lib/server/payment-provider";
export async function GET() {
  const provider = paymentProvider(env as any);
  return Response.json({ ok: true, plans: await billingCatalog((env as any).DB, provider), gatewayReady: !!provider }, { headers: billingHeaders });
}
