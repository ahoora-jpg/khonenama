import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { getImageKitConfig } from "@/lib/server/imagekit";
import { businessPlans } from "@/lib/business-plans";
import { paymentProvider } from "@/lib/server/payment-provider";

const headers = { "Cache-Control": "no-store" };
const requiredTables = ["businesses", "users", "business_members", "auth_sessions", "verification_requests", "leads", "lead_recipients", "lead_quotes", "plans", "subscriptions", "invoices", "payments", "payment_events"];

// Reports observed prerequisites, never treats a configured key as a working gateway.
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401, headers });
  }
  try {
    const db = env.DB;
    if (!db) return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503, headers });
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    const present = new Set((tables.results || []).map((row: { name: string }) => row.name));
    const missingTables = requiredTables.filter((table) => !present.has(table));
    const imagekit = getImageKitConfig();
    const paidPlans = businessPlans.filter((plan) => plan.code !== "free");
    const pricedPaidPlans = present.has("billing_prices") ? (await db.prepare("SELECT plan_code FROM billing_prices WHERE enabled=1 AND amount_toman>0").all()).results.map((r: any) => r.plan_code) : [];
    const providerConfigured = !!paymentProvider(env as any);
    return Response.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      database: { connected: true, missingTables },
      media: {
        provider: (env as any).MEDIA_STORAGE_PROVIDER === "r2" ? "r2" : "imagekit",
        encoder: "imagekit",
        r2Bound: Boolean((env as any).BUSINESS_MEDIA),
        serverUploadConfigured: Boolean(imagekit.privateKey && imagekit.urlEndpoint) && ((env as any).MEDIA_STORAGE_PROVIDER !== "r2" || Boolean((env as any).BUSINESS_MEDIA)),
      },
      billing: {
        readyForRealPayments: false,
        checkoutImplemented: true,
        callbackImplemented: true,
        providerConfigured,
        pricedPaidPlans,
        blockers: [...(!providerConfigured ? ["PAYMENT_PROVIDER_NOT_CONFIGURED"] : []), ...(pricedPaidPlans.length < paidPlans.length ? ["PAID_PLAN_PRICING_NOT_ACTIVE"] : []), "REAL_GATEWAY_END_TO_END_TEST_NOT_VERIFIED"],
      },
      operationalChecks: {
        backupRestoreDrill: "not_verified",
        paymentReconciliation: "not_implemented",
        orderSettlement: "not_implemented",
        ga4ConversionTracking: "not_verified",
      },
    }, { headers });
  } catch {
    console.error("commercial readiness database check failed");
    return Response.json({ ok: false, error: "READINESS_CHECK_FAILED" }, { status: 503, headers });
  }
}
