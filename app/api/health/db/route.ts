import { env } from "cloudflare:workers";

export async function GET() {
  try {
    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, database: "unbound" }, { status: 503 });
    }

    await db.prepare("SELECT 1 AS healthy").first();

    const reminderTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='profile_photo_reminders'").first();
    const settings = env as any;
    return Response.json({
      profileReminders: { configured: typeof settings.RESEND_API_KEY === "string" && settings.RESEND_API_KEY.length > 10 && !!settings.RECOVERY_EMAIL_FROM, scheduleInitialized: !!reminderTable },
      ok: true,
      database: "connected",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("D1 health check failed", error);
    return Response.json({ ok: false, database: "error" }, { status: 500 });
  }
}
