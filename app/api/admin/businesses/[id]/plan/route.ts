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
  const durationMonths = body?.durationMonths === undefined ? null : Number(body.durationMonths);
  const durationDays = durationMonths === null ? Number(body?.durationDays ?? 30) : durationMonths * 30;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
  if ((durationMonths !== null && (!Number.isSafeInteger(durationMonths) || durationMonths < 1 || durationMonths > 120)) || !ALLOWED.has(planCode) || !Number.isSafeInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
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
  const active = await db.prepare("SELECT s.ends_at, p.code FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')) ORDER BY s.id DESC LIMIT 1").bind(businessId).first();
  const base = active?.code === planCode && active?.ends_at ? String(active.ends_at) : "now";
  const endsAt = planCode === "free" ? null : (await db.prepare("SELECT datetime(?, ?) AS ends_at").bind(base, "+" + durationDays + " days").first())?.ends_at;
  if (planCode !== "free" && !endsAt) return Response.json({ ok: false, error: "INVALID_EXPIRY" }, { status: 400 });

  await db.batch([
    db
      .prepare("UPDATE subscriptions SET status = 'expired', ends_at = COALESCE(ends_at, CURRENT_TIMESTAMP) WHERE business_id = ? AND status = 'active'")
      .bind(businessId),
    db
      .prepare(
        "INSERT INTO subscriptions (business_id, plan_id, status, starts_at, ends_at, is_test) VALUES (?, ?, 'active', CURRENT_TIMESTAMP, ?, 1)"
      )
      .bind(businessId, plan.id, endsAt),
    db.prepare("INSERT INTO business_admin_actions (business_id,business_name,business_slug,action,reason) VALUES (?,?,?,'complimentary_plan',?)").bind(businessId,businessInfo?.name || '',businessInfo?.slug || '',JSON.stringify({planCode,durationDays,durationMonths,note})),
  ]);

  return Response.json({
    ok: true,
    complimentary: true,
    plan: { code: plan.code, name: plan.name },
    expiresInDays: planCode === "free" ? null : durationDays,
    endsAt,
  });
}
