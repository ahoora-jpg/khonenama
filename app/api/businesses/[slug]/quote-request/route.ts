import { env } from "cloudflare:workers";
import { ensureLeadPipelineSchema } from "@/lib/server/lead-pipeline";

function cleanText(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
    }

    await ensureLeadPipelineSchema(db);

    const business = await db
      .prepare(
        "SELECT b.id, b.name, b.city, b.area, bc.category_id " +
        "FROM businesses b " +
        "LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 " +
        "WHERE b.slug = ? AND b.status = 'published' LIMIT 1"
      )
      .bind(slug)
      .first();

    if (!business?.id) {
      return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const customerName = cleanText(body?.customerName, 120);
    const customerPhone = normalizeIranPhone(cleanText(body?.customerPhone, 32));
    const requestText = cleanText(body?.requestText, 1800);
    const budgetMinRaw = Number(body?.budgetMin || 0);
    const budgetMaxRaw = Number(body?.budgetMax || 0);
    const budgetMin = Number.isFinite(budgetMinRaw) && budgetMinRaw > 0 ? Math.round(budgetMinRaw) : null;
    const budgetMax = Number.isFinite(budgetMaxRaw) && budgetMaxRaw > 0 ? Math.round(budgetMaxRaw) : null;

    if (customerName.length < 2) {
      return Response.json({ ok: false, error: "INVALID_NAME" }, { status: 400 });
    }
    if (!/^09\d{9}$/.test(customerPhone)) {
      return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }
    if (requestText.length < 12) {
      return Response.json({ ok: false, error: "REQUEST_TOO_SHORT" }, { status: 400 });
    }

    const duplicate = await db
      .prepare(
        "SELECT l.id FROM leads l " +
        "JOIN lead_recipients lr ON lr.lead_id = l.id " +
        "WHERE lr.business_id = ? AND l.customer_phone = ? " +
        "AND l.created_at >= datetime('now','-5 minutes') LIMIT 1"
      )
      .bind(business.id, customerPhone)
      .first();

    if (duplicate?.id) {
      return Response.json(
        { ok: false, error: "TOO_SOON", existingLeadId: duplicate.id },
        { status: 429 }
      );
    }

    const lead = await db
      .prepare(
        "INSERT INTO leads (category_id, city, area, customer_name, customer_phone, request_text, budget_min, budget_max, status) " +
        "VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, 'matched') RETURNING id, created_at"
      )
      .bind(
        business.category_id || null,
        business.city || "کرج",
        business.area || "",
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
        "INSERT INTO lead_recipients (lead_id, business_id, unlocked_at, business_status, updated_at) " +
        "VALUES (?, ?, CURRENT_TIMESTAMP, 'new', CURRENT_TIMESTAMP)"
      )
      .bind(lead.id, business.id)
      .run();

    return Response.json(
      {
        ok: true,
        leadId: Number(lead.id),
        businessName: String(business.name || ""),
        privacy: "private_to_target_business",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("public quote request failed", error);
    return Response.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
