import { getOwnedBusiness } from "@/lib/server/business-media";

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
      "PRIMARY KEY (business_id, event_date)" +
    ")"
  ).run();
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  await ensureSchema(owned.db);

  const rows = await owned.db.prepare(
    "SELECT event_date, profile_views, phone_clicks, whatsapp_clicks, website_clicks, instagram_clicks, quote_starts, quote_submits " +
    "FROM business_analytics_daily WHERE business_id = ? AND event_date >= date('now','-29 days') ORDER BY event_date ASC"
  ).bind(owned.business.id).all();

  const daily = rows?.results || [];
  const totals = daily.reduce((acc: any, row: any) => {
    acc.profileViews += Number(row.profile_views || 0);
    acc.phoneClicks += Number(row.phone_clicks || 0);
    acc.whatsappClicks += Number(row.whatsapp_clicks || 0);
    acc.websiteClicks += Number(row.website_clicks || 0);
    acc.instagramClicks += Number(row.instagram_clicks || 0);
    acc.quoteStarts += Number(row.quote_starts || 0);
    acc.quoteSubmits += Number(row.quote_submits || 0);
    return acc;
  }, {
    profileViews:0, phoneClicks:0, whatsappClicks:0, websiteClicks:0,
    instagramClicks:0, quoteStarts:0, quoteSubmits:0
  });

  return Response.json({ ok: true, totals, daily }, { headers: { "Cache-Control":"no-store" } });
}
