import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { securityReadiness } from "@/lib/server/security-readiness";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!await isAdminRequest(request)) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers });
  const state = securityReadiness(env as unknown as Record<string, unknown>);
  return Response.json(state, { status: state.ready ? 200 : 503, headers });
}
