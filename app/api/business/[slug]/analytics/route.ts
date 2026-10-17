import { env } from "cloudflare:workers";
import { analyticsSource, ensureSourceSchema } from "@/lib/server/analytics-sources";

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
  if(/bot|crawler|spider|preview|headless/i.test(request.headers.get("user-agent")||""))return Response.json({ok:true,ignored:true});
  const body = await request.json().catch(() => ({}));
  const event = typeof body?.event === "string" ? body.event : "";
  if (!EVENTS.has(event)) {
    return Response.json({ ok: false, error: "INVALID_EVENT" }, { status: 400 });
  }
  // Successful submissions are measured when the server saves the request.
  // Older clients may still send this event; acknowledge without counting twice.
  if(event==="quote_sent")return Response.json({ok:true,ignored:true},{headers:{"Cache-Control":"no-store"}});

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
  const cookie=request.headers.get("cookie")?.match(/(?:^|;\s*)kn_analytics=([a-f0-9]{32})(?:;|$)/)?.[1];
  const visitor=cookie||crypto.randomUUID().replace(/-/g,"");
  await db.prepare("CREATE TABLE IF NOT EXISTS business_analytics_receipts (business_id INTEGER NOT NULL,visitor TEXT NOT NULL,event TEXT NOT NULL,time_bucket INTEGER NOT NULL,PRIMARY KEY(business_id,visitor,event,time_bucket))").run();
  await db.prepare("DELETE FROM business_analytics_receipts WHERE time_bucket<?").bind(Math.floor(Date.now()/1800000)-1440).run();
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO business_analytics_receipts(business_id,visitor,event,time_bucket) VALUES(?,?,?,?)").bind(business.id,visitor,event,Math.floor(Date.now()/1800000)),
    db.prepare("INSERT INTO business_analytics_daily (business_id,event_date,"+column+") SELECT ?,date('now'),1 WHERE changes()>0 ON CONFLICT(business_id,event_date) DO UPDATE SET "+column+"="+column+"+1").bind(business.id),
  ]);
  if(event==="view"){
    await ensureSourceSchema(db);
    // Count one source per booth/visitor/day, separately from raw engagement events.
    await db.prepare("CREATE TABLE IF NOT EXISTS business_analytics_visitors (business_id INTEGER NOT NULL,visitor TEXT NOT NULL,event_date TEXT NOT NULL,PRIMARY KEY(business_id,visitor,event_date))").run();
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO business_analytics_visitors(business_id,visitor,event_date) VALUES(?,?,date('now'))").bind(business.id,visitor),
      db.prepare("INSERT INTO business_analytics_sources(business_id,event_date,source,views) SELECT ?,date('now'),?,1 WHERE changes()>0 ON CONFLICT(business_id,event_date,source) DO UPDATE SET views=views+1").bind(business.id,analyticsSource(body.referrer,body.source)),
    ]);
    await db.prepare("DELETE FROM business_analytics_visitors WHERE event_date<date('now','-90 days')").run();
  }
  return Response.json({ok:true},{headers:{"Cache-Control":"no-store",...(!cookie?{"Set-Cookie":`kn_analytics=${visitor}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`}:{})}});

}
