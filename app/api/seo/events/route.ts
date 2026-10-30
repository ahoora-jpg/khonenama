import { env } from "cloudflare:workers";
import { crossSiteMutation } from "@/lib/request-security";

const allowedEvents = new Set(["page_view", "internal_click", "tool_interaction", "contact_intent", "lead_submit"]);
const allowedSources = new Set(["direct", "search", "ai", "social", "referral", "internal"]);
const allowedTargets = new Set(["", "business", "tool", "local", "category", "magazine", "search", "register", "app", "contact", "other"]);

function validPath(value: unknown) {
  return typeof value === "string"
    && value.startsWith("/")
    && !value.startsWith("//")
    && value.length <= 180
    && !/[\u0000-\u001f\u007f]/.test(value);
}

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

export async function POST(request: Request) {
  if (crossSiteMutation(request)) return new Response(null, { status: 403 });
  const agent = request.headers.get("user-agent") || "";
  if (/bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegrambot/i.test(agent)) {
    return new Response(null, { status: 204 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !allowedEvents.has(body.event) || !allowedSources.has(body.source)
      || !allowedTargets.has(body.targetGroup || "") || !validPath(body.path)) {
    return new Response(null, { status: 400 });
  }

  const db = (env as any).DB;
  await ensureTable(db);
  await db.prepare(`INSERT INTO seo_journey_daily(event_date,source,path,event,target_group,total)
    VALUES(date('now'),?,?,?,?,1)
    ON CONFLICT(event_date,source,path,event,target_group)
    DO UPDATE SET total=total+1`)
    .bind(body.source, body.path, body.event, body.targetGroup || "")
    .run();

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
