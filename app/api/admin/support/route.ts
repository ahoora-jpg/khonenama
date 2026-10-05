import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { ensureSupportTickets } from "@/lib/server/support-tickets";
export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const db = (env as any).DB; await ensureSupportTickets(db);
  const rows = await db.prepare("SELECT t.*,d.topic,d.assignee,d.next_step FROM support_tickets t LEFT JOIN support_ticket_details d ON d.ticket_id=t.id ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, t.id DESC LIMIT 200").all();
  return Response.json({ ok: true, tickets: rows.results || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const input = await request.json().catch(() => null);
  const id = Number(input?.id), reply = typeof input?.reply === "string" ? input.reply.trim() : "";
  if (!Number.isSafeInteger(id) || id < 1 || !['open','in_progress','resolved'].includes(input?.status) || reply.length > 2000) return Response.json({ ok: false }, { status: 400 });
  const assignee = typeof input?.assignee === 'string' ? input.assignee.trim() : '';
  const nextStep = typeof input?.nextStep === 'string' ? input.nextStep.trim() : '';
  if (assignee.length > 100 || nextStep.length > 500 || !assignee || !nextStep) return Response.json({ok:false},{status:400});
  const db = (env as any).DB; await ensureSupportTickets(db);
  const row = await db.prepare("UPDATE support_tickets SET status = ?, admin_reply = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id").bind(input.status, reply, id).first();
  if (row) await db.prepare("INSERT INTO support_ticket_details(ticket_id,assignee,next_step) VALUES(?,?,?) ON CONFLICT(ticket_id) DO UPDATE SET assignee=excluded.assignee,next_step=excluded.next_step").bind(id,assignee,nextStep).run();
  return Response.json({ ok: Boolean(row) }, { status: row ? 200 : 404 });
}
