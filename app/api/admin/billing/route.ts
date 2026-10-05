import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { ensureBilling } from "@/lib/server/billing-schema";
import { paymentProvider } from "@/lib/server/payment-provider";
export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const db = (env as any).DB;
  await ensureBilling(db);
  return Response.json({ ok: true, prices: (await db.prepare("SELECT * FROM billing_prices ORDER BY plan_code").all()).results, gatewayReady: !!paymentProvider(env as any) }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object") return Response.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  if (!["pro", "premium"].includes(body.planCode) || typeof body.enabled !== "boolean" || !Number.isInteger(body.durationDays) || body.durationDays < 1 || body.durationDays > 366 || !(body.amountToman === null && !body.enabled || Number.isSafeInteger(body.amountToman) && body.amountToman >= 1000 && body.amountToman <= 100000000)) return Response.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  const db = (env as any).DB;
  await ensureBilling(db);
  await db.batch([
    db.prepare("UPDATE billing_prices SET amount_toman=?,duration_days=?,enabled=?,updated_at=CURRENT_TIMESTAMP WHERE plan_code=?").bind(body.amountToman, body.durationDays, Number(body.enabled), body.planCode),
    db.prepare("INSERT INTO billing_price_audit(plan_code,amount_toman,duration_days,enabled) VALUES(?,?,?,?)").bind(body.planCode, body.amountToman, body.durationDays, Number(body.enabled)),
  ]);
  return Response.json({ ok: true });
}
