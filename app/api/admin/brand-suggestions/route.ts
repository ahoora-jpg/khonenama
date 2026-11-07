import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { resolveBrandSuggestion } from "@/lib/server/brand-directory";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const db = (env as any).DB;
  const rows = await db.prepare(
    "SELECT s.*, b.name AS business_name, b.slug AS business_slug FROM brand_suggestions s JOIN businesses b ON b.id=s.business_id " +
    "ORDER BY CASE s.status WHEN 'pending' THEN 0 ELSE 1 END, s.id DESC LIMIT 200"
  ).all();
  return Response.json({ ok: true, suggestions: rows.results || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const input = await request.json().catch(() => null);
  if (!Number.isSafeInteger(input?.id) || input.id < 1 || !["approve", "reject"].includes(input?.action)) {
    return Response.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }
  const result = await resolveBrandSuggestion((env as any).DB, { id: input.id, action: input.action, name: input.name, reviewedBy: "site_admin" });
  return Response.json({ ok: Boolean(result), result }, { status: result ? 200 : 404 });
}
