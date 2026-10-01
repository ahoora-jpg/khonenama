import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { getImageKitConfig } from "@/lib/server/imagekit";
import { businessPlans } from "@/lib/business-plans";

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
        checkoutImplemented: false,
        callbackImplemented: false,
        pricedPaidPlans: paidPlans.filter((plan) => plan.amountToman !== null && plan.purchasable).map((plan) => plan.code),
        blockers: ["PAYMENT_PROVIDER_NOT_IMPLEMENTED", "PAID_PLAN_PRICING_NOT_ACTIVE", "LEGAL_AND_MERCHANT_APPROVAL_NOT_VERIFIED"],
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
