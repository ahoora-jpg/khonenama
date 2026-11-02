import { env } from "cloudflare:workers";

export async function GET() {
  try {
    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
    }

    await db.prepare("SELECT 1 AS healthy").first();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  } catch {
    console.warn("D1_HEALTH_CHECK_FAILED");
    return Response.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
}
