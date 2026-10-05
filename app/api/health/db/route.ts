import { env } from "cloudflare:workers";

export async function GET() {
  try {
    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, database: "unbound" }, { status: 503 });
    }

    await db.prepare("SELECT 1 AS healthy").first();

    return Response.json({
      ok: true,
      database: "connected",


    });
  } catch (error) {
    console.error("D1 health check failed", error);
    return Response.json({ ok: false, database: "error" }, { status: 500 });
  }
}
