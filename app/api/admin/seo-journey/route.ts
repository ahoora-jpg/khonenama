import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";

async function ensureTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS seo_journey_daily (
    event_date TEXT NOT NULL,
    source TEXT NOT NULL,
    path TEXT NOT NULL,
    event TEXT NOT NULL,
    target_group TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_date, source, path, event, target_group)
  )`).run();
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const db = (env as any).DB;
  await ensureTable(db);

  const [sources, pages, events, targets, daily, businesses] = await Promise.all([
    db.prepare(`SELECT source,SUM(total) total FROM seo_journey_daily
      WHERE event='page_view' AND event_date>=date('now','-29 days')
      GROUP BY source ORDER BY total DESC`).all(),
    db.prepare(`SELECT path,source,SUM(total) total FROM seo_journey_daily
      WHERE event='page_view' AND event_date>=date('now','-29 days')
      GROUP BY path,source ORDER BY total DESC LIMIT 80`).all(),
    db.prepare(`SELECT event,SUM(total) total FROM seo_journey_daily
      WHERE event_date>=date('now','-29 days') GROUP BY event ORDER BY total DESC`).all(),
    db.prepare(`SELECT target_group,SUM(total) total FROM seo_journey_daily
      WHERE event='internal_click' AND event_date>=date('now','-29 days')
      GROUP BY target_group ORDER BY total DESC`).all(),
    db.prepare(`SELECT event_date,source,SUM(total) total FROM seo_journey_daily
      WHERE event='page_view' AND event_date>=date('now','-29 days')
      GROUP BY event_date,source ORDER BY event_date ASC`).all(),
    listPublishedBusinesses({ limit: 200 }),
  ]);

  const inventory = {
    published: businesses.length,
    withPhoto: businesses.filter((item: any) => item.media?.some((media: any) => media.kind !== "video" && media.url)).length,
    withThreePhotos: businesses.filter((item: any) => item.media?.filter((media: any) => media.kind !== "video" && media.url).length >= 3).length,
    withReviews: businesses.filter((item: any) => Number(item.reviewCount || 0) > 0).length,
    withUsefulDescription: businesses.filter((item: any) => String(item.description || "").trim().length >= 80).length,
    overlyBroadServices: businesses.filter((item: any) => Array.isArray(item.services) && item.services.length > 60).length,
  };
  const cityMap = new Map<string, number>();
  for (const item of businesses as any[]) {
    const city = String(item.city || "نامشخص");
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  }
  const cities = [...cityMap.entries()].map(([city,total]) => ({ city, total })).sort((a,b) => b.total - a.total);

  return Response.json({
    ok: true,
    periodDays: 30,
    sources: sources.results || [],
    pages: pages.results || [],
    events: events.results || [],
    targets: targets.results || [],
    daily: daily.results || [],
    inventory,
    cities,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
