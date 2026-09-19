import {
  clearBusinessSessionCookie,
  destroyBusinessSession,
} from "@/lib/server/business-session";

export async function POST(request: Request) {
  await destroyBusinessSession(request);
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearBusinessSessionCookie(),
        "Cache-Control": "no-store",
      },
    }
  );
}
