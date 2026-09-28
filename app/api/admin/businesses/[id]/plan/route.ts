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
  const durationDays = Math.max(1, Math.min(3650, Number(body?.durationDays) || 30));
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
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

  await db.prepare("CREATE TABLE IF NOT EXISTS business_admin_actions (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER,business_name TEXT,business_slug TEXT,action TEXT NOT NULL,previous_status TEXT,reason TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  const businessInfo = await db.prepare("SELECT name, slug FROM businesses WHERE id=?").bind(businessId).first();
  const endsAtSql = planCode === "free" ? "NULL" : "datetime('now', '+" + durationDays + " days')";

  await db.batch([
    db
      .prepare("UPDATE subscriptions SET status = 'expired', ends_at = COALESCE(ends_at, CURRENT_TIMESTAMP) WHERE business_id = ? AND status = 'active'")
      .bind(businessId),
    db
      .prepare(
        "INSERT INTO subscriptions (business_id, plan_id, status, starts_at, ends_at, is_test) VALUES (?, ?, 'active', CURRENT_TIMESTAMP, " + endsAtSql + ", 1)"
      )
      .bind(businessId, plan.id),
    db.prepare("INSERT INTO business_admin_actions (business_id,business_name,business_slug,action,reason) VALUES (?,?,?,'complimentary_plan',?)").bind(businessId,businessInfo?.name || '',businessInfo?.slug || '',JSON.stringify({planCode,durationDays,note})),
  ]);

  return Response.json({
    ok: true,
    complimentary: true,
    plan: { code: plan.code, name: plan.name },
    expiresInDays: planCode === "free" ? null : durationDays,
  });
}
