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

function money(value: unknown) {
  const digits = normalizeDigits(String(value ?? "")).replace(/\D/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = (env as any).DB;
  if (!db) {
    return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));

  // Honeypot: real users never fill this field.
  if (clean(body?.website, 200)) {
    return Response.json({ ok: true, requestCode: "accepted" });
  }

  const customerName = clean(body?.customerName, 120);
  const customerPhone = normalizeIranPhone(clean(body?.customerPhone, 40));
  const requestText = clean(body?.requestText, 1600);
  const area = clean(body?.area, 100);
  const budgetMin = money(body?.budgetMin);
  const budgetMax = money(body?.budgetMax);

  if (customerName.length < 2) {
    return Response.json({ ok: false, error: "INVALID_NAME" }, { status: 400 });
  }
  if (!/^09\d{9}$/.test(customerPhone)) {
    return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
  }
  if (requestText.length < 10) {
    return Response.json({ ok: false, error: "REQUEST_TOO_SHORT" }, { status: 400 });
  }
  if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin) {
    return Response.json({ ok: false, error: "INVALID_BUDGET" }, { status: 400 });
  }

  const business = await db
    .prepare(
      "SELECT b.id, b.city, b.area, bc.category_id " +
      "FROM businesses b " +
      "LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 " +
      "WHERE b.slug = ? AND b.status = 'published' LIMIT 1"
    )
    .bind(slug)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  const duplicate = await db
    .prepare(
      "SELECT l.id FROM leads l JOIN lead_recipients lr ON lr.lead_id = l.id " +
      "WHERE lr.business_id = ? AND l.customer_phone = ? " +
      "AND l.created_at >= datetime('now','-5 minutes') ORDER BY l.id DESC LIMIT 1"
    )
    .bind(business.id, customerPhone)
    .first();

  if (duplicate?.id) {
    return Response.json({
      ok: true,
      duplicate: true,
      requestCode: "KH-" + String(duplicate.id).padStart(6, "0"),
    });
  }

  const lead = await db
    .prepare(
      "INSERT INTO leads (category_id, city, area, customer_name, customer_phone, request_text, budget_min, budget_max, status) " +
      "VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, 'open') RETURNING id"
    )
    .bind(
      business.category_id || null,
      business.city,
      area || business.area || "",
      customerName,
      customerPhone,
      requestText,
      budgetMin,
      budgetMax
    )
    .first();

  const leadId = Number(lead?.id);
  if (!leadId) {
    return Response.json({ ok: false, error: "LEAD_CREATE_FAILED" }, { status: 500 });
  }

  await db
    .prepare(
      "INSERT INTO lead_recipients (lead_id, business_id, unlocked_at, price_credits) VALUES (?, ?, CURRENT_TIMESTAMP, 0)"
    )
    .bind(leadId, business.id)
    .run();

  return Response.json(
    {
      ok: true,
      requestCode: "KH-" + String(leadId).padStart(6, "0"),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
