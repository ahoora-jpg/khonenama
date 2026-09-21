"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Eye, MessageCircle, MousePointerClick, Sparkles } from "lucide-react";

type Totals = {
  profileViews: number;
  phoneClicks: number;
  whatsappClicks: number;
  websiteClicks: number;
  instagramClicks: number;
  quoteStarts: number;
  quoteSubmits: number;
};

const empty: Totals = {
  profileViews:0, phoneClicks:0, whatsappClicks:0, websiteClicks:0,
  instagramClicks:0, quoteStarts:0, quoteSubmits:0
};

export default function BusinessAnalyticsPanel({ plan = "free" }: { plan?: string }) {
  const [totals, setTotals] = useState<Totals>(empty);
  const [loading, setLoading] = useState(true);
  const advanced = plan === "pro" || plan === "premium";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/business/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (!cancelled && result?.ok) setTotals({ ...empty, ...result.totals });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const contactClicks = totals.phoneClicks + totals.whatsappClicks + totals.websiteClicks + totals.instagramClicks;
  const conversion = useMemo(() => {
    if (!totals.profileViews) return 0;
    return Math.round((totals.quoteSubmits / totals.profileViews) * 1000) / 10;
  }, [totals.profileViews, totals.quoteSubmits]);

  return (
    <section className="dashboard-panel glass-panel business-analytics-panel" id="analytics">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">عملکرد ۳۰ روز اخیر</span>
          <h2>آمار پروفایل</h2>
        </div>
        <BarChart3 size={20} />
      </div>

      <div className="analytics-mini-grid">
        <div><Eye size={18} /><strong>{loading ? "—" : totals.profileViews}</strong><small>بازدید پروفایل</small></div>
        <div><MousePointerClick size={18} /><strong>{loading ? "—" : contactClicks}</strong><small>کلیک ارتباط</small></div>
        <div><MessageCircle size={18} /><strong>{loading ? "—" : totals.quoteSubmits}</strong><small>درخواست قیمت</small></div>
        <div><Sparkles size={18} /><strong>{loading ? "—" : conversion + "٪"}</strong><small>نرخ تبدیل</small></div>
      </div>

      {advanced ? (
        <div className="analytics-detail-list">
          <span>تماس تلفنی <strong>{totals.phoneClicks}</strong></span>
          <span>واتساپ <strong>{totals.whatsappClicks}</strong></span>
          <span>وب‌سایت <strong>{totals.websiteClicks}</strong></span>
          <span>اینستاگرام <strong>{totals.instagramClicks}</strong></span>
          <span>شروع فرم قیمت <strong>{totals.quoteStarts}</strong></span>
        </div>
      ) : (
        <div className="analytics-upgrade-note">
          جزئیات کانال‌های ورودی و عملکرد کامل در پلن حرفه‌ای و ویژه نمایش داده می‌شود.
        </div>
      )}
    </section>
  );
}
