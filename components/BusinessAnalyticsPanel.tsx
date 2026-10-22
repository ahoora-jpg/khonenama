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
  proposalsSent?: number;
  proposalsAccepted?: number;
  averageResponseMinutes?: number|null;
};

const empty: Totals = {
  profileViews:0, phoneClicks:0, whatsappClicks:0, websiteClicks:0,
  instagramClicks:0, quoteStarts:0, quoteSubmits:0
};

export default function BusinessAnalyticsPanel({ plan = "free" }: { plan?: string }) {
  const [totals, setTotals] = useState<Totals>(empty);
  const [loading, setLoading] = useState(true);
  const [level,setLevel]=useState("free");
  const [days,setDays]=useState(30);
  const [daily,setDaily]=useState<{event_date:string;profile_views:number}[]>([]);
  const [comparison,setComparison]=useState<any>(null);
  const [error,setError]=useState("");
  const [sources,setSources]=useState<{source:string;views:number}[]>([]);
  const [promotionViews,setPromotionViews]=useState(0);
  const advanced = level === "pro" || level === "premium";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);setError("");
    fetch("/api/me/business/analytics?days="+days, { cache: "no-store" })
      .then(async r => {if(!r.ok)throw new Error();return r.json();})
      .then((result) => {
        if (!cancelled && result?.ok) {setTotals({ ...empty, ...result.totals });setLevel(result.level||"free");setDaily(result.daily||[]);setComparison(result.comparison||null);setSources(result.sources||[]);setPromotionViews(Number(result.promotionViews||0));}
      })
      .catch(() => {if(!cancelled)setError("دریافت آمار انجام نشد؛ دوباره تلاش کنید.");})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const contactClicks = totals.phoneClicks + totals.whatsappClicks + totals.websiteClicks + totals.instagramClicks;
  const conversion = useMemo(() => {
    if (!totals.profileViews) return 0;
    return Math.round((totals.quoteSubmits / totals.profileViews) * 1000) / 10;
  }, [totals.profileViews, totals.quoteSubmits]);

  return (
    <section className="dashboard-panel glass-panel business-analytics-panel" id="analytics">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">عملکرد {days.toLocaleString("fa-IR")} روز اخیر</span>
          <h2>آمار پروفایل</h2>
        </div>
        <BarChart3 size={20} />
      </div>
      {error&&<p role="alert">{error}</p>}
      {level==="premium"&&<label>بازه گزارش<select value={days} onChange={event=>setDays(Number(event.target.value))}><option value={7}>۷ روز اخیر</option><option value={30}>۳۰ روز اخیر</option><option value={90}>۹۰ روز اخیر</option></select></label>}
      {!error && <>
      <div className="analytics-mini-grid">
        <div><Eye size={18} /><strong>{loading ? "—" : totals.profileViews}</strong><small>بازدید پروفایل</small></div>
        {advanced&&<div><MousePointerClick size={18} /><strong>{loading ? "—" : contactClicks}</strong><small>کلیک ارتباط</small></div>}
        <div><MessageCircle size={18} /><strong>{loading ? "—" : totals.quoteSubmits}</strong><small>درخواست قیمت</small></div>
        {advanced&&<div><Sparkles size={18} /><strong>{loading ? "—" : conversion + "٪"}</strong><small>نسبت درخواست‌های دریافتی به بازدید؛ بدون انتساب قطعی</small></div>}
      </div>

      {advanced ? (
        <div className="analytics-detail-list">
          <p>ورود ثبت‌شده به غرفه از لینک یا کد QR تبلیغاتی: {promotionViews.toLocaleString("fa-IR")}</p>
          <p>این عدد بازدید استوری در اینستاگرام نیست؛ آمار بازدید خود استوری فقط در حساب اینستاگرام قابل مشاهده است. ورود از این لینک ممکن است از روش‌های دیگری هم انجام شود.</p>
          {level==="premium"&&<div><h3>منابع ورود</h3>{sources.map(row=><p key={row.source}>{{search:"موتور جستجو",social:"شبکه اجتماعی",promotion:"لینک تبلیغاتی",internal:"داخل سایت",referral:"سایت دیگر",unknown:"مستقیم یا نامشخص"}[row.source]||"نامشخص"}: {Number(row.views).toLocaleString("fa-IR")}</p>)}<p>این داده‌ها از زمان فعال‌شدن ثبت منابع جمع‌آوری می‌شوند؛ منبع نامشخص الزاماً ورود مستقیم نیست.</p></div>}
          <div style={{width:"100%"}}><h3>بازدید روزانه</h3><div style={{display:"flex",alignItems:"end",gap:2,height:100}} aria-label="نمودار بازدید روزانه">{daily.map(row=><div key={row.event_date} title={`${row.event_date}: ${row.profile_views}`} style={{flex:1,minWidth:1,background:"var(--ink)",height:`${Math.max(1,Number(row.profile_views)/Math.max(1,...daily.map(d=>Number(d.profile_views)))*100)}%`}} />)}</div><details><summary>جدول داده‌های نمودار</summary><table><thead><tr><th>روز</th><th>بازدید</th></tr></thead><tbody>{daily.map(row=><tr key={row.event_date}><td>{new Date(row.event_date+"T12:00:00Z").toLocaleDateString("fa-IR")}</td><td>{Number(row.profile_views).toLocaleString("fa-IR")}</td></tr>)}</tbody></table></details></div>
          {comparison&&<div><h3>مقایسه با دورهٔ قبل</h3>{[["بازدید",comparison.views],["کلیک ارتباط",comparison.contactClicks]].map(([label,value]:any)=><p key={label}>{label}: {value.current.toLocaleString("fa-IR")}؛ دوره قبل: {value.previous.toLocaleString("fa-IR")}؛ {value.percent===null?"درصد تغییر قابل محاسبه نیست":`${value.percent.toLocaleString("fa-IR")}٪ تغییر`}</p>)}</div>}
          <span>کلیک روی شماره تماس <strong>{totals.phoneClicks}</strong></span>
          <span>واتساپ <strong>{totals.whatsappClicks}</strong></span>
          <span>وب‌سایت <strong>{totals.websiteClicks}</strong></span>
          <span>اینستاگرام <strong>{totals.instagramClicks}</strong></span>
          <span>شروع فرم قیمت <strong>{totals.quoteStarts}</strong></span>
          <span>پیشنهادهای ارسال‌شده <strong>{totals.proposalsSent||0}</strong></span>
          <span>پیشنهادهای انتخاب‌شده <strong>{totals.proposalsAccepted||0}</strong></span>
          <span>میانگین زمان پاسخ اولیه؛ نه وعده حضور <strong>{totals.averageResponseMinutes==null?'—':totals.averageResponseMinutes+' دقیقه'}</strong></span>
          <p>کلیک روی شماره نشان نمی‌دهد تماس برقرار شده است. تعداد بازدیدها و کلیک‌ها بر اساس رویدادهای ثبت‌شده در سایت است؛ بازدیدهای تکراری در بازه کوتاه ممکن است یک بار شمرده شوند و ثبت همه رویدادها تضمین نمی‌شود. انتخاب پیشنهاد یا کلیک تماس به معنی خرید یا پرداخت قطعی نیست.</p>
        </div>
      ) : (
        <div className="analytics-upgrade-note">
          جزئیات کانال‌های ورودی و عملکرد کامل در پلن حرفه‌ای و ویژه نمایش داده می‌شود.
        </div>
      )}
      </>}
    </section>
  );
}
