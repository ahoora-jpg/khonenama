import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

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

  await db.prepare("CREATE TABLE IF NOT EXISTS business_visibility_controls (business_id INTEGER PRIMARY KEY,owner_paused INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();

  const [sources, pages, events, targets, daily, inventoryRow, citiesResult] = await Promise.all([
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
    db.prepare(`SELECT
      COUNT(*) AS published,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM business_media m
        WHERE m.business_id=b.id AND m.kind IN ('cover','image')
          AND COALESCE(m.media_type,'image')<>'video' AND length(trim(COALESCE(m.file_url,'')))>0
      ) THEN 1 ELSE 0 END) AS with_photo,
      SUM(CASE WHEN (
        SELECT COUNT(*) FROM business_media m
        WHERE m.business_id=b.id AND m.kind IN ('cover','image')
          AND COALESCE(m.media_type,'image')<>'video' AND length(trim(COALESCE(m.file_url,'')))>0
      )>=3 THEN 1 ELSE 0 END) AS with_three_photos,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM reviews r WHERE r.business_id=b.id AND r.status='published'
      ) THEN 1 ELSE 0 END) AS with_reviews,
      SUM(CASE WHEN length(trim(COALESCE(b.description,'')))>=80 THEN 1 ELSE 0 END) AS with_useful_description,
      SUM(CASE WHEN (
        SELECT COUNT(*) FROM business_services bs WHERE bs.business_id=b.id
      )>60 THEN 1 ELSE 0 END) AS overly_broad_services
      FROM businesses b
      WHERE b.status='published'
        AND b.slug NOT GLOB 'ghrfh-azmayshy-tbdyl-[0-9]*-thran'
        AND b.slug <> 'alayy-dkvr-krj'
        AND NOT EXISTS (
          SELECT 1 FROM business_visibility_controls v WHERE v.business_id=b.id AND v.owner_paused=1
        )`).first(),
    db.prepare(`SELECT COALESCE(NULLIF(trim(b.city),''),'نامشخص') city,COUNT(*) total
      FROM businesses b
      WHERE b.status='published'
        AND b.slug NOT GLOB 'ghrfh-azmayshy-tbdyl-[0-9]*-thran'
        AND b.slug <> 'alayy-dkvr-krj'
        AND NOT EXISTS (
          SELECT 1 FROM business_visibility_controls v WHERE v.business_id=b.id AND v.owner_paused=1
        )
      GROUP BY COALESCE(NULLIF(trim(b.city),''),'نامشخص')
      ORDER BY total DESC`).all(),
  ]);

  const inventory = {
    published: Number(inventoryRow?.published || 0),
    withPhoto: Number(inventoryRow?.with_photo || 0),
    withThreePhotos: Number(inventoryRow?.with_three_photos || 0),
    withReviews: Number(inventoryRow?.with_reviews || 0),
    withUsefulDescription: Number(inventoryRow?.with_useful_description || 0),
    overlyBroadServices: Number(inventoryRow?.overly_broad_services || 0),
  };
  const cities = citiesResult.results || [];

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
