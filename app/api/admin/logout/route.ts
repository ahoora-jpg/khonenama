import { clearAdminCookie } from "@/lib/server/admin-session";

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearAdminCookie(),
        "Cache-Control": "no-store",
      },
    }
  );
}
