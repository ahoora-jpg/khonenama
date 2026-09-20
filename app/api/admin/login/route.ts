import {
  adminConfigured,
  createAdminCookie,
  verifyAdminAccessKey,
} from "@/lib/server/admin-session";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return Response.json({ ok: false, error: "ADMIN_NOT_CONFIGURED" }, { status: 503 });
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
