import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

const ALLOWED = new Set(["free", "pro", "premium"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const businessId = Number(id);
  if (!Number.isInteger(businessId) || businessId < 1) {
    return Response.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const planCode = typeof body?.planCode === "string" ? body.planCode : "";
  if (!ALLOWED.has(planCode)) {
    return Response.json({ ok: false, error: "INVALID_PLAN" }, { status: 400 });
  }

  const db = (env as any).DB;
  const [business, plan] = await Promise.all([
    db.prepare("SELECT id FROM businesses WHERE id = ? LIMIT 1").bind(businessId).first(),
    db.prepare("SELECT id, code, name FROM plans WHERE code = ? AND is_active = 1 LIMIT 1").bind(planCode).first(),
  ]);

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }
  if (!plan?.id) {
    return Response.json({ ok: false, error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  const endsAtSql = planCode === "free" ? "NULL" : "datetime('now', '+30 days')";

  await db.batch([
    db
      .prepare("UPDATE subscriptions SET status = 'expired', ends_at = COALESCE(ends_at, CURRENT_TIMESTAMP) WHERE business_id = ? AND status = 'active'")
      .bind(businessId),
    db
      .prepare(
        "INSERT INTO subscriptions (business_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, 'active', CURRENT_TIMESTAMP, " + endsAtSql + ")"
      )
      .bind(businessId, plan.id),
  ]);

  return Response.json({
    ok: true,
    testMode: true,
    plan: { code: plan.code, name: plan.name },
    expiresInDays: planCode === "free" ? null : 30,
  });
}
