import {
  clearBusinessSessionCookie,
  destroyBusinessSession,
  getBusinessSession,
} from "@/lib/server/business-session";
import {env} from "cloudflare:workers";
import {ensureWebPushSchema} from "@/lib/server/business-web-push";

export async function POST(request: Request) {
  const session=await getBusinessSession(request);
  if(session?.user_id){
    const db=(env as any).DB;
    await ensureWebPushSchema(db);
    await db.prepare("UPDATE business_web_push SET active=0 WHERE user_id=?").bind(session.user_id).run();
  }
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
