import { getOwnedBusiness } from "@/lib/server/business-media";
import { promotionSubscription, storyTemplateCount } from "@/lib/server/business-promotion";
import { ensureSourceSchema } from "@/lib/server/analytics-sources";

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
  const subscription = await promotionSubscription(owned.db,owned.business.id);
  const advanced = storyTemplateCount(subscription?.code)>0;
  const premium = subscription?.code === "premium";
  const requestedDays=Number(new URL(request.url).searchParams.get("days")||30);
  const days=premium&&[7,30,90].includes(requestedDays)?requestedDays:30;

  await ensureSchema(owned.db);
  await owned.db.prepare("CREATE TABLE IF NOT EXISTS lead_quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER NOT NULL, business_id INTEGER NOT NULL, amount INTEGER, message TEXT, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(lead_id,business_id))").run();

  const rows = await owned.db.prepare(
    "SELECT event_date, profile_views, phone_clicks, whatsapp_clicks, website_clicks, instagram_clicks, quote_starts, quote_submits " +
    "FROM business_analytics_daily WHERE business_id = ? AND event_date >= date('now',?) ORDER BY event_date ASC"
  ).bind(owned.business.id,`-${days-1} days`).all();

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

  const proposals = await owned.db.prepare("SELECT COUNT(*) AS sent, SUM(CASE WHEN q.status='accepted' THEN 1 ELSE 0 END) AS accepted, AVG(MAX(0,(julianday(q.created_at)-julianday(l.created_at))*1440)) AS response_minutes FROM lead_quotes q JOIN leads l ON l.id=q.lead_id WHERE q.business_id=? AND q.created_at >= datetime('now',?) AND q.status IN ('sent','accepted','rejected')").bind(owned.business.id,`-${days} days`).first();
  totals.proposalsSent=Number(proposals?.sent||0); totals.proposalsAccepted=Number(proposals?.accepted||0); totals.averageResponseMinutes=proposals?.response_minutes==null?null:Math.round(proposals.response_minutes);
  // Read real saved requests rather than treating a click as a submitted quote.
  const leads=await owned.db.prepare("SELECT COUNT(DISTINCT l.id) AS n FROM leads l JOIN lead_recipients r ON r.lead_id=l.id WHERE r.business_id=? AND l.status!='cancelled' AND l.created_at>=datetime('now',?)").bind(owned.business.id,`-${days} days`).first();
  totals.quoteSubmits=Number(leads?.n||0);
  if(!advanced)return Response.json({ok:true,level:"free",days,totals:{profileViews:totals.profileViews,quoteSubmits:totals.quoteSubmits},daily:[]},{headers:{"Cache-Control":"private, no-store"}});
  const byDate=new Map(daily.map((row:any)=>[row.event_date,row]));
  const filled=Array.from({length:days},(_,index)=>{const date=new Date();date.setUTCDate(date.getUTCDate()-days+1+index);const key=date.toISOString().slice(0,10);return byDate.get(key)||{event_date:key,profile_views:0};});
  let comparison=null;
  if(premium){
    const previous=await owned.db.prepare("SELECT COALESCE(SUM(profile_views),0) AS views, COALESCE(SUM(phone_clicks+whatsapp_clicks+website_clicks+instagram_clicks),0) AS clicks FROM business_analytics_daily WHERE business_id=? AND event_date>=date('now',?) AND event_date<date('now',?)").bind(owned.business.id,`-${days*2-1} days`,`-${days-1} days`).first();
    const change=(current:number,before:number)=>({current,previous:before,difference:current-before,percent:before?Math.round((current-before)/before*1000)/10:null});
    comparison={views:change(totals.profileViews,Number(previous?.views||0)),contactClicks:change(totals.phoneClicks+totals.whatsappClicks+totals.websiteClicks+totals.instagramClicks,Number(previous?.clicks||0))};
  }
  await ensureSourceSchema(owned.db);
  const sourceRows=await owned.db.prepare("SELECT source,SUM(views) AS views FROM business_analytics_sources WHERE business_id=? AND event_date>=date('now',?) GROUP BY source").bind(owned.business.id,`-${days-1} days`).all();
  const promotionViews=(sourceRows.results||[]).find((row:any)=>row.source==="promotion")?.views||0;
  return Response.json({ ok: true, level:premium?"premium":"pro",days,totals, daily:filled,comparison,promotionViews,sources:premium?sourceRows.results:undefined,sourceNotice:"منابع ورود از زمان فعال‌شدن ثبت این داده‌ها محاسبه می‌شوند؛ منبع نامشخص الزاماً ورود مستقیم نیست." }, { headers: { "Cache-Control":"private, no-store" } });
}
