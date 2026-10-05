import { businessPlans } from "@/lib/business-plans";
import { ensureBilling } from "./billing-schema";
import { activateSubscriptionFromVerifiedPayment } from "./billing-activation";
import type { PaymentProvider } from "./payment-provider";

export const billingHeaders = { "Cache-Control": "private, no-store" };
export class BillingError extends Error {
  constructor(public code: string, public status = 409) { super(code); }
}
export async function billingCatalog(db: any, provider: PaymentProvider | null) {
  await ensureBilling(db);
  const rows = (await db.prepare("SELECT * FROM billing_prices").all()).results || [];
  return businessPlans.map(plan => {
    const price = rows.find((r: any) => r.plan_code === plan.code);
    const amountToman = plan.code === "free" ? 0 : price?.enabled === 1 ? Number(price.amount_toman) || null : null;
    return { ...plan, amountToman, durationDays: plan.code === "free" ? null : Number(price?.duration_days || 30), purchasable: plan.code !== "free" && !!amountToman && !!provider };
  });
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
export async function createCheckout(owner: any, body: any, provider: PaymentProvider | null) {
  const { db, business, session } = owner;
  const plans = await billingCatalog(db, provider);
  const plan = plans.find(p => p.code === body?.planCode);
  if (!plan) throw new BillingError("PLAN_NOT_FOUND", 404);
  if (plan.code === "free") throw new BillingError("FREE_PLAN_DOES_NOT_REQUIRE_PAYMENT");
  if (!provider) throw new BillingError("PAYMENT_PROVIDER_NOT_CONFIGURED", 503);
  if (!plan.amountToman) throw new BillingError("PLAN_PRICING_NOT_ACTIVE");
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(body?.requestKey || "")) throw new BillingError("INVALID_REQUEST_KEY", 400);
  if (body.expectedAmountToman !== plan.amountToman || body.expectedDurationDays !== plan.durationDays) throw new BillingError("QUOTE_CHANGED");
  const prior = await db.prepare("SELECT c.*,p.status,p.provider,p.provider_authority,i.expires_at FROM billing_checkouts c JOIN payments p ON p.id=c.payment_id JOIN invoices i ON i.id=p.invoice_id WHERE c.business_id=? AND c.request_key=?").bind(business.id, body.requestKey).first();
  if (prior) {
    if (prior.plan_code !== plan.code) throw new BillingError("REQUEST_KEY_REUSED");
    if (prior.status === "redirected" && prior.provider === provider.code && Date.parse(prior.expires_at + "Z") > Date.now()) return { id: prior.id, redirectUrl: gatewayUrl(prior.provider, prior.provider_authority) };
    throw new BillingError(prior.status === "verified" ? "ALREADY_PAID" : "CHECKOUT_ALREADY_CREATED");
  }
  const current = await db.prepare("SELECT p.code,s.ends_at FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')) ORDER BY s.id DESC LIMIT 1").bind(business.id).first();
  const rank: Record<string, number> = { free: 0, pro: 1, premium: 2 };
  if (current && rank[current.code] > rank[plan.code]) throw new BillingError("LOWER_PLAN_ACTIVE");
  if (current && current.code === plan.code && !current.ends_at) throw new BillingError("INDEFINITE_PLAN_ACTIVE");
  const planRow = await db.prepare("SELECT id FROM plans WHERE code=? AND is_active=1").bind(plan.code).first();
  if (!planRow) throw new BillingError("PLAN_NOT_FOUND", 404);
  const id = crypto.randomUUID(), secret = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const callbackHash = await hash(secret), invoiceNumber = "KH-" + id;
  await db.batch([
    db.prepare("INSERT INTO invoices(invoice_number,business_id,user_id,plan_id,subtotal_amount,total_amount,currency,status,description,expires_at) VALUES(?,?,?,?,?,?,'IRT','pending',?,datetime('now','+30 minutes'))").bind(invoiceNumber, business.id, session.user_id, planRow.id, plan.amountToman, plan.amountToman, `اشتراک ${plan.name} برای ${plan.durationDays} روز`),
    db.prepare("INSERT INTO payments(invoice_id,provider,amount,currency,idempotency_key) SELECT id,?,?,'IRT',? FROM invoices WHERE invoice_number=?").bind(provider.code, plan.amountToman, id, invoiceNumber),
    db.prepare("INSERT INTO billing_checkouts(id,payment_id,business_id,plan_code,amount_toman,duration_days,request_key,callback_hash,source) SELECT ?,id,?,?,?,?,?,?,? FROM payments WHERE idempotency_key=?").bind(id, business.id, plan.code, plan.amountToman, plan.durationDays, body.requestKey, callbackHash, body.source === "app" ? "app" : "web", id),
  ]);
  try {
    const callbackUrl = `https://www.khonenama.ir/api/billing/callback?checkout=${id}&token=${secret}`;
    const gateway = await provider.request({ amountRial: plan.amountToman * 10, callbackUrl, description: `خونه‌نما؛ اشتراک ${plan.name}؛ ${invoiceNumber}` });
    const redirectUrl = gatewayUrl(provider.code, gateway.authority);
    await db.prepare("UPDATE payments SET provider_authority=?,status='redirected' WHERE idempotency_key=? AND status='created'").bind(gateway.authority, id).run();
    return { id, redirectUrl };
  } catch {
    await db.batch([
      db.prepare("UPDATE payments SET status='failed',failed_at=CURRENT_TIMESTAMP WHERE idempotency_key=? AND status='created'").bind(id),
      db.prepare("UPDATE invoices SET status='failed',updated_at=CURRENT_TIMESTAMP WHERE invoice_number=? AND status='pending'").bind(invoiceNumber),
    ]);
    throw new BillingError("PAYMENT_REQUEST_FAILED", 502);
  }
}
function gatewayUrl(provider: string, authority: string) {
  if (provider !== "zarinpal" || !/^A[a-zA-Z0-9]{35}$/.test(authority || "")) throw new BillingError("INVALID_PAYMENT_AUTHORITY", 400);
  return `https://www.zarinpal.com/pg/StartPay/${authority}`;
}
export async function verifyCheckout(db: any, id: string, provider: PaymentProvider | null, callback?: { token: string; authority: string; status: string }) {
  await ensureBilling(db);
  const row = await db.prepare("SELECT c.*,p.invoice_id,p.provider,p.provider_authority,p.status,p.amount,p.currency,i.total_amount,i.status invoice_status FROM billing_checkouts c JOIN payments p ON p.id=c.payment_id JOIN invoices i ON i.id=p.invoice_id WHERE c.id=?").bind(id).first();
  if (!row) throw new BillingError("NOT_FOUND", 404);
  if (callback && (!/^[a-f0-9]{64}$/.test(callback.token) || await hash(callback.token) !== row.callback_hash || callback.authority !== row.provider_authority)) throw new BillingError("INVALID_CALLBACK", 400);
  if (row.status === "verified") { await activateSubscriptionFromVerifiedPayment(db, row.payment_id); return "paid"; }
  if (["failed", "cancelled", "refunded"].includes(row.status)) return row.status;
  if (!provider || row.provider !== provider.code) throw new BillingError("PAYMENT_PROVIDER_NOT_CONFIGURED", 503);
  if (!row.provider_authority) return "pending";
  if (row.amount !== row.amount_toman || row.amount !== row.total_amount || row.currency !== "IRT" || row.invoice_status !== "pending") throw new BillingError("PAYMENT_AMOUNT_MISMATCH");
  // Return Status is advisory. A forged NOK must not invalidate an actually paid transaction.
  let result;
  try { result = await provider.verify(row.provider_authority, row.amount_toman * 10); }
  catch { return "pending"; }
  if (!result.verified || !result.reference) {
    if (!["-21", "-51"].includes(result.code)) return "pending";
    await db.batch([
      db.prepare("UPDATE payments SET status='failed',failed_at=CURRENT_TIMESTAMP,raw_code=? WHERE id=? AND status IN ('created','redirected','pending')").bind(result.code, row.payment_id),
      db.prepare("UPDATE invoices SET status='failed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM payments WHERE id=? AND status='failed')").bind(row.invoice_id, row.payment_id),
    ]);
    return "failed";
  }
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO billing_receipts(provider,reference,payment_id) VALUES(?,?,?)").bind(provider.code, result.reference, row.payment_id),
    db.prepare("UPDATE payments SET status='verified',provider_reference=?,verified_at=COALESCE(verified_at,CURRENT_TIMESTAMP),raw_code=? WHERE id=? AND status IN ('redirected','pending','verified') AND EXISTS(SELECT 1 FROM billing_receipts WHERE provider=? AND reference=? AND payment_id=?)").bind(result.reference, result.code, row.payment_id, provider.code, result.reference, row.payment_id),
  ]);
  await activateSubscriptionFromVerifiedPayment(db, row.payment_id);
  return "paid";
}
export async function billingHistory(db: any, businessId: number) {
  await ensureBilling(db);
  return (await db.prepare("SELECT c.id,c.plan_code,c.duration_days,c.activation_ends_at,i.invoice_number,i.total_amount,i.currency,i.status,i.created_at,p.provider_reference,p.status payment_status FROM billing_checkouts c JOIN payments p ON p.id=c.payment_id JOIN invoices i ON i.id=p.invoice_id WHERE c.business_id=? ORDER BY i.id DESC LIMIT 30").bind(businessId).all()).results || [];
}
