import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";

function normalizeDigits(value: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (char) => String(fa.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String(ar.indexOf(char)));
}

function normalizePhone(value: unknown) {
  let phone = normalizeDigits(typeof value === "string" ? value : "").replace(/[^\d+]/g, "");
  if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
  if (phone.startsWith("98") && phone.length === 12) phone = "0" + phone.slice(2);
  return phone;
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function ensureSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS account_deletion_requests (" +
      "id TEXT PRIMARY KEY," +
      "user_id TEXT," +
      "business_id INTEGER," +
      "phone TEXT NOT NULL," +
      "business_name TEXT," +
      "reason TEXT," +
      "source TEXT NOT NULL," +
      "status TEXT NOT NULL DEFAULT 'verification_required'," +
      "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "resolved_at TEXT" +
    ")"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_account_deletion_phone_status ON account_deletion_requests(phone, status, created_at)"
  ).run();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (cleanText(body?.companyWebsite, 120)) {
    return Response.json({ ok: true, requestId: "accepted" }, { status: 202 });
  }

  const session = await getBusinessSession(request);
  const db = (env as any).DB;
  if (!db) return Response.json({ ok: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 });

  let phone = session?.phone ? normalizePhone(session.phone) : normalizePhone(body?.phone);
  let businessId: number | null = null;
  let businessName = cleanText(body?.businessName, 180);

  if (session?.user_id) {
    const business = await db.prepare(
      "SELECT b.id, b.name, COALESCE(NULLIF(b.phone, ''), u.phone) AS phone FROM businesses b JOIN business_members bm ON bm.business_id = b.id AND bm.user_id = ? AND bm.status = 'active' JOIN users u ON u.id = bm.user_id ORDER BY b.id DESC LIMIT 1"
    ).bind(session.user_id).first();
    if (business?.id) {
      businessId = Number(business.id);
      businessName = String(business.name || businessName);
      phone = normalizePhone(business.phone || phone);
    }
  }

  if (!/^09\d{9}$/.test(phone)) {
    return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
  }

  await ensureSchema(db);
  const existing = await db.prepare(
    "SELECT id, status FROM account_deletion_requests WHERE phone = ? AND status IN ('verification_required','pending') AND created_at > datetime('now', '-1 day') ORDER BY created_at DESC LIMIT 1"
  ).bind(phone).first();

  if (existing?.id) {
    return Response.json({ ok: true, requestId: existing.id, status: existing.status }, { status: 200 });
  }

  const requestId = "del_" + crypto.randomUUID();
  const status = session?.user_id ? "pending" : "verification_required";
  await db.prepare(
    "INSERT INTO account_deletion_requests (id, user_id, business_id, phone, business_name, reason, source, status) VALUES (?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?)"
  ).bind(
    requestId,
    session?.user_id || null,
    businessId,
    phone,
    businessName,
    cleanText(body?.reason, 1000),
    session?.user_id ? "authenticated_app_or_web" : "public_web",
    status
  ).run();

  return Response.json({ ok: true, requestId, status }, { status: 202, headers: { "Cache-Control": "no-store" } });
}
