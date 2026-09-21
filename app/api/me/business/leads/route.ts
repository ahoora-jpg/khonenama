import { getOwnedBusiness } from "@/lib/server/business-media";

async function ensureLeadQuoteSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS lead_quotes (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "lead_id INTEGER NOT NULL," +
      "business_id INTEGER NOT NULL," +
      "amount INTEGER," +
      "message TEXT," +
      "status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','accepted','rejected','withdrawn'))," +
      "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "UNIQUE(lead_id, business_id)," +
      "FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE," +
      "FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE" +
    ")"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_lead_quotes_business ON lead_quotes(business_id, status, updated_at)"
  ).run();
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function amountValue(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureLeadQuoteSchema(owned.db);

  const rows = await owned.db
    .prepare(
      "SELECT l.id, l.customer_name, l.customer_phone, l.request_text, l.city, l.area, " +
      "l.budget_min, l.budget_max, l.status, l.created_at, " +
      "q.amount AS quote_amount, q.message AS quote_message, q.status AS quote_status, q.updated_at AS quote_updated_at " +
      "FROM lead_recipients lr " +
      "JOIN leads l ON l.id = lr.lead_id " +
      "LEFT JOIN lead_quotes q ON q.lead_id = l.id AND q.business_id = lr.business_id " +
      "WHERE lr.business_id = ? " +
      "ORDER BY CASE l.status WHEN 'open' THEN 0 WHEN 'matched' THEN 1 ELSE 2 END, l.created_at DESC LIMIT 100"
    )
    .bind(owned.business.id)
    .all();

  return Response.json(
    { ok: true, leads: rows?.results || [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureLeadQuoteSchema(owned.db);

  const body = await request.json().catch(() => ({}));
  const leadId = Number(body?.leadId);
  const action = clean(body?.action, 30);

  if (!Number.isInteger(leadId) || leadId < 1) {
    return Response.json({ ok: false, error: "INVALID_LEAD" }, { status: 400 });
  }

  const recipient = await owned.db
    .prepare("SELECT lead_id FROM lead_recipients WHERE lead_id = ? AND business_id = ? LIMIT 1")
    .bind(leadId, owned.business.id)
    .first();

  if (!recipient?.lead_id) {
    return Response.json({ ok: false, error: "LEAD_NOT_FOUND" }, { status: 404 });
  }

  if (action === "status") {
    const status = ["open", "matched", "closed", "cancelled"].includes(body?.status)
      ? String(body.status)
      : "";
    if (!status) {
      return Response.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
    }
    await owned.db
      .prepare("UPDATE leads SET status = ? WHERE id = ?")
      .bind(status, leadId)
      .run();
    return Response.json({ ok: true, status });
  }

  if (action === "quote") {
    const amount = amountValue(body?.amount);
    const message = clean(body?.message, 1200);

    if (amount === null && message.length < 3) {
      return Response.json({ ok: false, error: "EMPTY_QUOTE" }, { status: 400 });
    }

    await owned.db
      .prepare(
        "INSERT INTO lead_quotes (lead_id, business_id, amount, message, status) " +
        "VALUES (?, ?, ?, NULLIF(?, ''), 'sent') " +
        "ON CONFLICT(lead_id, business_id) DO UPDATE SET " +
        "amount = excluded.amount, message = excluded.message, status = 'sent', updated_at = CURRENT_TIMESTAMP"
      )
      .bind(leadId, owned.business.id, amount, message)
      .run();

    await owned.db
      .prepare("UPDATE leads SET status = 'matched' WHERE id = ? AND status = 'open'")
      .bind(leadId)
      .run();

    return Response.json({ ok: true, status: "sent" });
  }

  return Response.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
}
