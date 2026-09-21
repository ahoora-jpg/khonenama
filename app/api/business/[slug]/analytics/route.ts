import { env } from "cloudflare:workers";

const EVENTS = new Set(["view","phone","whatsapp","website","instagram","quote_start","quote_sent"]);

async function ensureSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_analytics_daily (" +
      "business_id INTEGER NOT NULL," +
      "event_date TEXT NOT NULL," +
      "profile_views INTEGER NOT NULL DEFAULT 0," +
      "phone_clicks INTEGER NOT NULL DEFAULT 0," +
      "whatsapp_clicks INTEGER NOT NULL DEFAULT 0," +
      "website_clicks INTEGER NOT NULL DEFAULT 0," +
      "instagram_clicks INTEGER NOT NULL DEFAULT 0," +
      "quote_starts INTEGER NOT NULL DEFAULT 0," +
      "quote_submits INTEGER NOT NULL DEFAULT 0," +
      "PRIMARY KEY (business_id, event_date)," +
      "FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE" +
    ")"
  ).run();
}

const COLUMN: Record<string,string> = {
  view: "profile_views",
  phone: "phone_clicks",
  whatsapp: "whatsapp_clicks",
  website: "website_clicks",
  instagram: "instagram_clicks",
  quote_start: "quote_starts",
  quote_sent: "quote_submits",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const event = typeof body?.event === "string" ? body.event : "";
  if (!EVENTS.has(event)) {
    return Response.json({ ok: false, error: "INVALID_EVENT" }, { status: 400 });
  }

  const db = (env as any).DB;
  if (!db) return Response.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });
  await ensureSchema(db);

  const business = await db
    .prepare("SELECT id FROM businesses WHERE slug = ? AND status = 'published' LIMIT 1")
    .bind(slug)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  const column = COLUMN[event];
  await db.prepare(
    "INSERT INTO business_analytics_daily (business_id, event_date, " + column + ") " +
    "VALUES (?, date('now'), 1) " +
    "ON CONFLICT(business_id, event_date) DO UPDATE SET " + column + " = " + column + " + 1"
  ).bind(business.id).run();

  return Response.json({ ok: true });
}
