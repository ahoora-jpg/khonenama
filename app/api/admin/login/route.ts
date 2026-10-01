import {
  adminConfigured,
  createAdminCookie,
  verifyAdminAccessKey,
} from "@/lib/server/admin-session";
import { allowAdminLogin } from "@/lib/server/admin-login-rate-limit";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!adminConfigured()) {
    return Response.json({ ok: false, error: "ADMIN_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    if (!(await allowAdminLogin(request))) return Response.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "AUTH_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const body = await request.json().catch(() => ({}));
  const key = typeof body?.key === "string" ? body.key : "";

  if (!(await verifyAdminAccessKey(key))) {
    return Response.json({ ok: false, error: "INVALID_ADMIN_KEY" }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": await createAdminCookie(),
        "Cache-Control": "no-store",
      },
    }
  );
}
