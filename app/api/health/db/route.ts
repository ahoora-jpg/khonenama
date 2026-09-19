import { env } from "cloudflare:workers";

export async function GET() {
  try {
    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, database: "unbound" }, { status: 503 });
    }

    const tableCount = await db
      .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .first();

    const businessCount = await db
      .prepare("SELECT COUNT(*) AS count FROM businesses")
      .first();

    return Response.json({
      ok: true,
      database: "connected",
      tables: Number(tableCount?.count || 0),
      businesses: Number(businessCount?.count || 0),
    });
  } catch (error) {
    console.error("D1 health check failed", error);
    return Response.json({ ok: false, database: "error" }, { status: 500 });
  }
}
