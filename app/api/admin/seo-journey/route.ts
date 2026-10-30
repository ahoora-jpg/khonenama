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

  const [sources, pages, events, targets, daily] = await Promise.all([
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
  ]);

  return Response.json({
    ok: true,
    periodDays: 30,
    sources: sources.results || [],
    pages: pages.results || [],
    events: events.results || [],
    targets: targets.results || [],
    daily: daily.results || [],
  }, { headers: { "Cache-Control": "private, no-store" } });
}
