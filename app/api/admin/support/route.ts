import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { ensureSupportTickets } from "@/lib/server/support-tickets";
export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const db = (env as any).DB; await ensureSupportTickets(db);
  const rows = await db.prepare("SELECT * FROM support_tickets ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, id DESC LIMIT 200").all();
  return Response.json({ ok: true, tickets: rows.results || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const input = await request.json().catch(() => null);
  const id = Number(input?.id), reply = typeof input?.reply === "string" ? input.reply.trim() : "";
  if (!Number.isSafeInteger(id) || id < 1 || !['open','in_progress','resolved'].includes(input?.status) || reply.length > 2000) return Response.json({ ok: false }, { status: 400 });
  const db = (env as any).DB; await ensureSupportTickets(db);
  const row = await db.prepare("UPDATE support_tickets SET status = ?, admin_reply = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id").bind(input.status, reply, id).first();
  return Response.json({ ok: Boolean(row) }, { status: row ? 200 : 404 });
}
