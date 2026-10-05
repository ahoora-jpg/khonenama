import { validateQuoteTerms } from '@/lib/quote-terms';
import { ensureQuoteDetails, parseQuoteJson } from '@/lib/server/quote-details';
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
  const digits = String(value ?? "").replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[,،\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 1_000_000_000_000 ? amount : null;
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureLeadQuoteSchema(owned.db);
  await ensureQuoteDetails(owned.db);

  const rows = await owned.db
    .prepare(
      "SELECT l.id, l.customer_name, l.customer_phone, l.request_text, l.city, l.area, " +
      "l.budget_min, l.budget_max, l.status, l.created_at, " +
      "q.amount AS quote_amount, q.message AS quote_message, q.status AS quote_status, q.updated_at AS quote_updated_at, d.revision, d.details_json, d.agreed_json, p.status AS recipient_status " +
      "FROM lead_recipients lr " +
      "JOIN leads l ON l.id = lr.lead_id " +
      "LEFT JOIN lead_quotes q ON q.lead_id = l.id AND q.business_id = lr.business_id " +
      "LEFT JOIN lead_quote_details d ON d.quote_id = q.id " +
      "LEFT JOIN lead_recipient_progress p ON p.lead_id=l.id AND p.business_id=lr.business_id " +
      "WHERE lr.business_id = ? " +
      "ORDER BY CASE l.status WHEN 'open' THEN 0 WHEN 'matched' THEN 1 ELSE 2 END, l.created_at DESC LIMIT 100"
    )
    .bind(owned.business.id)
    .all();

  return Response.json(
    { ok: true, leads: (rows?.results || []).map((row: any)=>({...row, terms:parseQuoteJson(row.details_json), agreed:parseQuoteJson(row.agreed_json)})) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureLeadQuoteSchema(owned.db);

  await ensureQuoteDetails(owned.db);
  await ensureQuoteDetails(owned.db);
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
    // A recipient can only close its own participation, never all other shops' requests.
    await owned.db.prepare("INSERT INTO lead_recipient_progress(lead_id,business_id,status) VALUES(?,?,?) ON CONFLICT(lead_id,business_id) DO UPDATE SET status=excluded.status,updated_at=CURRENT_TIMESTAMP").bind(leadId,owned.business.id,status).run();
    return Response.json({ ok: true, status });
  }

  if (action === "quote") {
    const amount = amountValue(body?.amount);
    const message = clean(body?.message, 1200);

    const terms = validateQuoteTerms(body?.terms);
    if (amount === null || !terms) return Response.json({ok:false,error:'INVALID_QUOTE_DETAILS'},{status:400});
    const current = await owned.db.prepare("SELECT q.id,d.revision FROM lead_quotes q LEFT JOIN lead_quote_details d ON d.quote_id=q.id WHERE q.lead_id=? AND q.business_id=?").bind(leadId,owned.business.id).first();
    if (current?.revision && body.expectedRevision !== current.revision) return Response.json({ok:false,error:'STALE_QUOTE'},{status:409});
    const revision = crypto.randomUUID();
    const details = JSON.stringify(terms);
    if (current?.id) {
      // Keep the accepted snapshot while a new price, material or schedule awaits consent.
      const result = await owned.db.batch([
        owned.db.prepare("INSERT INTO lead_quote_details(quote_id,revision,details_json,agreed_json) SELECT id,?,?,CASE WHEN status='accepted' THEN json_object('amount',amount,'message',message,'terms',NULL) ELSE NULL END FROM lead_quotes WHERE id=? ON CONFLICT(quote_id) DO UPDATE SET agreed_json=CASE WHEN (SELECT status FROM lead_quotes WHERE id=excluded.quote_id)='accepted' THEN json_object('amount',(SELECT amount FROM lead_quotes WHERE id=excluded.quote_id),'message',(SELECT message FROM lead_quotes WHERE id=excluded.quote_id),'terms',json(lead_quote_details.details_json)) ELSE lead_quote_details.agreed_json END,revision=excluded.revision,details_json=excluded.details_json,updated_at=CURRENT_TIMESTAMP WHERE lead_quote_details.revision=?").bind(revision,details,current.id,current.revision || ''),
        owned.db.prepare("UPDATE lead_quotes SET amount=?,message=?,status='sent',updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM lead_quote_details WHERE quote_id=? AND revision=?)").bind(amount,message,current.id,current.id,revision),
        owned.db.prepare("INSERT OR IGNORE INTO lead_quote_events(quote_id,revision,event,payload_json) SELECT q.id,d.revision,'proposal',json_object('amount',q.amount,'message',q.message,'terms',json(d.details_json)) FROM lead_quotes q JOIN lead_quote_details d ON d.quote_id=q.id WHERE d.revision=?").bind(revision),
      ]);
      if (!result[1]?.meta?.changes) return Response.json({ok:false,error:'STALE_QUOTE'},{status:409});
    } else {
      const result = await owned.db.batch([
        owned.db.prepare("INSERT INTO lead_quotes(lead_id,business_id,amount,message,status) VALUES(?,?,?,?,'sent') ON CONFLICT(lead_id,business_id) DO NOTHING").bind(leadId,owned.business.id,amount,message),
        owned.db.prepare("INSERT INTO lead_quote_details(quote_id,revision,details_json) SELECT id,?,? FROM lead_quotes WHERE lead_id=? AND business_id=? AND NOT EXISTS(SELECT 1 FROM lead_quote_details WHERE quote_id=lead_quotes.id)").bind(revision,details,leadId,owned.business.id),
        owned.db.prepare("INSERT OR IGNORE INTO lead_quote_events(quote_id,revision,event,payload_json) SELECT q.id,d.revision,'proposal',json_object('amount',q.amount,'message',q.message,'terms',json(d.details_json)) FROM lead_quotes q JOIN lead_quote_details d ON d.quote_id=q.id WHERE d.revision=?").bind(revision),
      ]);
      if (!result[0]?.meta?.changes) return Response.json({ok:false,error:'STALE_QUOTE'},{status:409});
    }

    await owned.db
      .prepare("UPDATE leads SET status = 'matched' WHERE id = ? AND status = 'open'")
      .bind(leadId)
      .run();

    return Response.json({ ok: true, status: "sent" });
  }

  return Response.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
}
