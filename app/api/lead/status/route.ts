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

function leadIdFromCode(value: string) {
  const normalized = normalizeDigits(value).toUpperCase().replace(/\s/g, "");
  const match = normalized.match(/^KH-?0*(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function ensureQuoteSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS lead_quotes (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "lead_id INTEGER NOT NULL," +
      "business_id INTEGER NOT NULL," +
      "amount INTEGER," +
      "message TEXT," +
      "status TEXT NOT NULL DEFAULT 'draft'," +
      "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "UNIQUE(lead_id, business_id)" +
    ")"
  ).run();
}

export async function POST(request: Request) {
  const db = (env as any).DB;
  if (!db) {
    return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const requestCode = typeof body?.requestCode === "string" ? body.requestCode.trim() : "";
  const customerPhone = normalizeIranPhone(
    typeof body?.customerPhone === "string" ? body.customerPhone : ""
  );
  const leadId = leadIdFromCode(requestCode);

  if (!leadId || !/^09\d{9}$/.test(customerPhone)) {
    return Response.json({ ok: false, error: "INVALID_LOOKUP" }, { status: 400 });
  }

  await ensureQuoteSchema(db);

  const lead = await db
    .prepare(
      "SELECT id, customer_name, request_text, city, area, budget_min, budget_max, status, created_at " +
      "FROM leads WHERE id = ? AND customer_phone = ? LIMIT 1"
    )
    .bind(leadId, customerPhone)
    .first();

  if (!lead?.id) {
    return Response.json({ ok: false, error: "REQUEST_NOT_FOUND" }, { status: 404 });
  }

  const recipients = await db
    .prepare(
      "SELECT b.slug, b.name, b.phone, b.whatsapp, " +
      "q.amount, q.message, q.status AS quote_status, q.updated_at AS quote_updated_at " +
      "FROM lead_recipients lr " +
      "JOIN businesses b ON b.id = lr.business_id " +
      "LEFT JOIN lead_quotes q ON q.lead_id = lr.lead_id AND q.business_id = lr.business_id " +
      "WHERE lr.lead_id = ? ORDER BY b.id"
    )
    .bind(leadId)
    .all();

  return Response.json(
    {
      ok: true,
      request: {
        code: "KH-" + String(leadId).padStart(6, "0"),
        customerName: lead.customer_name || "",
        requestText: lead.request_text || "",
        city: lead.city || "",
        area: lead.area || "",
        budgetMin: lead.budget_min ?? null,
        budgetMax: lead.budget_max ?? null,
        status: lead.status || "open",
        createdAt: lead.created_at || "",
      },
      businesses: (recipients?.results || []).map((row: any) => ({
        slug: row.slug,
        name: row.name,
        phone: row.phone || "",
        whatsapp: row.whatsapp || "",
        quote:
          row.quote_status === "sent" || row.quote_status === "accepted"
            ? {
                amount: row.amount ?? null,
                message: row.message || "",
                status: row.quote_status,
                updatedAt: row.quote_updated_at || "",
              }
            : null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
