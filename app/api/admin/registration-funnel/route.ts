import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

const stages = [
  ["registration_view", "باز شدن فرم"],
  ["registration_account_step", "مرحله حساب"],
  ["registration_business_step", "مشخصات کسب‌وکار"],
  ["registration_service_step", "خدمات و محدوده"],
  ["registration_media_step", "معرفی و رسانه"],
  ["registration_review_step", "مرور نهایی"],
  ["registration_submit_attempt", "تلاش برای ثبت"],
  ["business_registered", "حساب و غرفه ثبت شد"],
  ["booth_published", "غرفه منتشر شد"],
] as const;

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401, headers });
  }
  const db = (env as any).DB;
  if (!db) return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503, headers });

  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS marketplace_conversion_daily (event_date TEXT NOT NULL, event TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(event_date,event))").run();
    const rows = await db.prepare("SELECT event,SUM(count) AS count FROM marketplace_conversion_daily WHERE event_date>=date('now','-29 days') GROUP BY event").all();
    const counts = new Map<string, number>((rows.results || []).map((row: any) => [String(row.event), Number(row.count || 0)]));
    const failures = counts.get("registration_submit_failed") || 0;
    return Response.json({
      ok: true,
      periodDays: 30,
      stages: stages.map(([event, label]) => ({ event, label, count: counts.get(event) || 0 })),
      submitFailures: failures,
      privacy: "فقط شمارش روزانهٔ رویدادهای ناشناس ذخیره می‌شود؛ شماره، نام، متن فرم و مسیر کاربر ثبت نمی‌شود.",
    }, { headers });
  } catch {
    return Response.json({ ok: false, error: "REPORT_UNAVAILABLE" }, { status: 503, headers });
  }
}
