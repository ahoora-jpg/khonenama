import { env } from "cloudflare:workers";
import { verifyCheckout } from "@/lib/server/billing";
import { paymentProvider } from "@/lib/server/payment-provider";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  let status = "pending";
  const id = query.get("checkout") || "", token = query.get("token") || "", authority = query.get("Authority") || "";
  if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(token) || !/^A[a-zA-Z0-9]{35}$/.test(authority)) status = "invalid";
  else {
    try { status = await verifyCheckout((env as any).DB, id, paymentProvider(env as any), { token, authority, status: query.get("Status") || "" }); }
    catch { status = "pending"; }
  }
  // No customer data, receipt or callback secret is reflected into the public result URL.
  return new Response(null, { status: 303, headers: { Location: `https://www.khonenama.ir/billing/result?status=${encodeURIComponent(status)}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
