import { env } from "cloudflare:workers";

function normalizeDigits(value: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (char) => String(fa.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String(ar.indexOf(char)));
}

function normalizeIranPhone(value: string) {
  let phone = normalizeDigits(value).replace(/[^\d+]/g, "");
  if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
  if (phone.startsWith("98") && phone.length === 12) phone = "0" + phone.slice(2);
  return phone;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = (env as any).DB;
  if (!db) return Response.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  if (clean(body?.company, 120)) {
    return Response.json({ ok: true });
  }

  const customerName = clean(body?.customerName, 100);
  const customerPhone = normalizeIranPhone(clean(body?.customerPhone, 40));
  const requestText = clean(body?.requestText, 1400);
  const city = clean(body?.city, 80) || "کرج";
  const area = clean(body?.area, 120);
  const budgetMin = Number.isFinite(Number(body?.budgetMin)) ? Math.max(0, Math.round(Number(body.budgetMin))) : null;
  const budgetMax = Number.isFinite(Number(body?.budgetMax)) ? Math.max(0, Math.round(Number(body.budgetMax))) : null;

  if (customerName.length < 2 || !/^09\d{9}$/.test(customerPhone) || requestText.length < 10) {
    return Response.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  const business = await db
    .prepare(
      "SELECT b.id, b.city, b.area, " +
      "(SELECT bc.category_id FROM business_categories bc WHERE bc.business_id = b.id ORDER BY bc.is_primary DESC, bc.category_id LIMIT 1) AS category_id " +
      "FROM businesses b WHERE b.slug = ? AND b.status = 'published' LIMIT 1"
    )
    .bind(slug)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  const duplicate = await db
    .prepare(
      "SELECT l.id FROM leads l JOIN lead_recipients lr ON lr.lead_id = l.id " +
      "WHERE lr.business_id = ? AND l.customer_phone = ? AND l.created_at > datetime('now','-2 minutes') LIMIT 1"
    )
    .bind(business.id, customerPhone)
    .first();

  if (duplicate?.id) {
    return Response.json({ ok: true, duplicate: true, leadId: duplicate.id });
  }

  const lead = await db
    .prepare(
      "INSERT INTO leads (category_id, city, area, customer_name, customer_phone, request_text, budget_min, budget_max, status) " +
      "VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, 'open') RETURNING id"
    )
    .bind(
      business.category_id || null,
      city || business.city || "کرج",
      area || business.area || "",
      customerName,
      customerPhone,
      requestText,
      budgetMin,
      budgetMax
    )
    .first();

  if (!lead?.id) {
    return Response.json({ ok: false, error: "LEAD_CREATE_FAILED" }, { status: 500 });
  }

  await db
    .prepare(
      "INSERT OR IGNORE INTO lead_recipients (lead_id, business_id, unlocked_at, price_credits) VALUES (?, ?, CURRENT_TIMESTAMP, 0)"
    )
    .bind(lead.id, business.id)
    .run();

  return Response.json({ ok: true, leadId: lead.id });
}
