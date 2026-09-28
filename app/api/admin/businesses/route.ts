import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = (env as any).DB;
  const [rows, summary] = await Promise.all([db
    .prepare(
      "SELECT b.id, b.slug, b.name, b.description, b.city, b.area, b.phone, b.status, b.verification_status, b.created_at, b.updated_at, u.full_name AS owner_name, u.phone AS owner_phone, CASE WHEN u.password_hash IS NOT NULL AND u.password_hash <> '' THEN 1 ELSE 0 END AS has_password, c.name AS category_name, vr.id AS review_request_id, vr.status AS review_status, vr.requested_at, COALESCE((SELECT p.code FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.business_id = b.id AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) ORDER BY s.id DESC LIMIT 1), 'free') AS plan_code, COALESCE((SELECT p.name FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.business_id = b.id AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) ORDER BY s.id DESC LIMIT 1), 'پایه') AS plan_name, (SELECT s.ends_at FROM subscriptions s WHERE s.business_id=b.id AND s.status='active' AND (s.ends_at IS NULL OR s.ends_at>CURRENT_TIMESTAMP) ORDER BY s.id DESC LIMIT 1) AS subscription_ends_at, COALESCE((SELECT s.is_test FROM subscriptions s WHERE s.business_id=b.id AND s.status='active' AND (s.ends_at IS NULL OR s.ends_at>CURRENT_TIMESTAMP) ORDER BY s.id DESC LIMIT 1),0) AS complimentary, (SELECT pay.status FROM payments pay JOIN invoices i ON i.id=pay.invoice_id WHERE i.business_id=b.id ORDER BY pay.id DESC LIMIT 1) AS last_payment_status, (SELECT pay.amount FROM payments pay JOIN invoices i ON i.id=pay.invoice_id WHERE i.business_id=b.id ORDER BY pay.id DESC LIMIT 1) AS last_payment_amount, (SELECT pay.provider_reference FROM payments pay JOIN invoices i ON i.id=pay.invoice_id WHERE i.business_id=b.id ORDER BY pay.id DESC LIMIT 1) AS last_payment_reference FROM businesses b LEFT JOIN users u ON u.id = b.owner_user_id LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id LEFT JOIN verification_requests vr ON vr.id = (SELECT id FROM verification_requests WHERE business_id = b.id AND kind = 'business' ORDER BY id DESC LIMIT 1) WHERE b.status IN ('pending','published','draft','suspended') ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'draft' THEN 1 WHEN 'published' THEN 2 ELSE 3 END, b.updated_at DESC LIMIT 100"
    )
    .all(), db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published, (SELECT COUNT(*) FROM subscriptions WHERE status='active' AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP)) AS active_subscriptions, (SELECT COUNT(*) FROM payments WHERE status='verified') AS paid_count, (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='verified') AS revenue FROM businesses WHERE status IN ('pending','published','draft','suspended')").first()]);

  return Response.json(
    { ok: true, businesses: rows?.results || [], summary: summary || {} },
    { headers: { "Cache-Control": "no-store" } }
  );
}
