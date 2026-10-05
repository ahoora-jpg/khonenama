import { env } from "cloudflare:workers";
import { ensureSupportTickets, supportTopics } from "@/lib/server/support-tickets";
export async function POST(request: Request) {
  const db = (env as any).DB;
  if (!db) return Response.json({ ok: false, error: "UNAVAILABLE" }, { status: 503 });
  const input = await request.json().catch(() => null);
  const topic = input?.topic ?? (input?.reviewId ? 'review' : 'general');
  if (typeof topic !== 'string' || !Object.prototype.hasOwnProperty.call(supportTopics,topic) || (input?.reviewId && topic !== 'review')) return Response.json({ok:false,error:'INVALID_TOPIC'},{status:400});
  const contact = typeof input?.contact === "string" ? input.contact.trim() : "";
  const message = typeof input?.message === "string" ? input.message.trim() : "";
  const slug = typeof input?.businessSlug === "string" ? input.businessSlug.trim() : "";
  const reviewId = input?.reviewId == null ? null : Number(input.reviewId);
  if (input?.website || contact.length < 5 || contact.length > 150 || message.length < 10 || message.length > 2000 || slug.length > 200 || (reviewId !== null && (!Number.isSafeInteger(reviewId) || reviewId < 1)))
    return Response.json({ ok: false, error: "INVALID_TICKET" }, { status: 400 });
  if (slug && !await db.prepare("SELECT id FROM businesses WHERE slug = ? AND status = 'published'").bind(slug).first()) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (reviewId && !await db.prepare("SELECT r.id FROM reviews r JOIN businesses b ON b.id = r.business_id WHERE r.id = ? AND b.slug = ? AND r.status = 'published'").bind(reviewId, slug).first()) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  await ensureSupportTickets(db);
  const recent = await db.prepare("SELECT COUNT(*) AS count FROM support_tickets WHERE contact = ? AND created_at > datetime('now','-1 hour')").bind(contact).first();
  if (Number(recent?.count) >= 3) return Response.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
  const token = crypto.randomUUID().replace(/-/g,'');
  const row = await db.prepare("INSERT INTO support_tickets (business_slug,review_id,contact,message,tracking_token) VALUES (?,?,?,?,?) RETURNING id").bind(slug || null, reviewId, contact, message, token).first();
  await db.prepare("INSERT INTO support_ticket_details(ticket_id,topic) VALUES(?,?)").bind(row.id,topic).run();
  return Response.json({ ok: true, code: "SUP-" + row.id + '-' + token }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
