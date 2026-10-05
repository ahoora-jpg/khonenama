"use client";

import { useEffect, useState } from "react";
import AdminBusinessHistory from "@/components/AdminBusinessHistory";
import { CheckCircle2, Crown, FlaskConical, KeyRound, LogOut, RefreshCw, RotateCcw, Search, Sparkles, Store, Trash2, XCircle } from "lucide-react";

type BusinessRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  city: string;
  area: string;
  phone: string;
  status: string;
  verification_status: string;
  owner_name: string;
  owner_phone: string;
  category_name: string;
  requested_at?: string;
  review_status?: string;
  plan_code?: "free" | "pro" | "premium";
  plan_name?: string;
  has_password?: number;
  subscription_ends_at?: string;
  complimentary?: number;
  last_payment_status?: string;
  last_payment_amount?: number;
  last_payment_reference?: string;
};

type Summary = { total?: number; pending?: number; published?: number; active_subscriptions?: number; paid_count?: number; revenue?: number };
const statusLabels: Record<string,string> = {published:'منتشرشده',pending:'در انتظار بررسی',draft:'پیش‌نویس',suspended:'تعلیق‌شده',verified:'تأییدشده',unverified:'تأییدنشده',created:'ایجادشده',redirected:'ارجاع به درگاه',failed:'ناموفق',cancelled:'لغوشده',refunded:'بازپرداخت‌شده'};

export default function AdminBusinessModeration() {
  const [items, setItems] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState<Summary>({});
  const [showRemoved, setShowRemoved] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/businesses", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");
      setItems(result.businesses || []);
      setSummary(result.summary || {});
    } catch {
      setMessage("دریافت فهرست کسب‌وکارها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: number, action: "approve" | "reject") {
    const note =
      action === "reject"
        ? window.prompt("دلیل رد یا اصلاح موردنیاز را بنویسید:", "") || ""
        : "";

    if (action==='reject' && note.trim().length<3) {setMessage('برای رد، دلیل قابل فهم و روش اصلاح را بنویسید.');return;}
    const response = await fetch("/api/admin/businesses/" + id + "/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      setMessage("ثبت تصمیم انجام نشد.");
      return;
    }

    setMessage(action === "approve" ? "نشان تأیید کسب‌وکار فعال شد." : "درخواست تأیید رد شد؛ پروفایل عمومی همچنان منتشر می‌ماند.");
    await load();
  }

  async function setTestPlan(id: number, planCode: "free" | "pro" | "premium", giftDays?: number) {
    setMessage("");
    if(planCode === "free" && !window.confirm("اشتراک فعلی پایان می‌یابد و امکانات پایه باقی می‌ماند. ادامه می‌دهید؟")) return;
    let durationMonths: number | undefined;
    let durationDays = planCode === "free" ? 30 : giftDays ?? 0;
    if (planCode !== "free" && giftDays === undefined) {
      const value = (window.prompt("مدت هدیه را با واحد بنویسید؛ مثلاً ۴۰ روز، ۶۰ روز یا ۱۲ ماه. هر ماه ۳۰ روز است.", "40 روز") || "").replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).trim();
      const match = value.match(/^(\d+)\s*(روز|ماه)?$/);
      if (!match) { setMessage("مدت را به صورت عدد و روز یا ماه وارد کنید."); return; }
      if (match[2] === "ماه") durationMonths = Number(match[1]);
      durationDays = Number(match[1]) * (match[2] === "ماه" ? 30 : 1);
    }
    if (planCode !== "free" && (!Number.isFinite(durationDays) || durationDays < 1)) return;
    const note = window.prompt("علت هدیه را بنویسید (مثلاً همکاری یا معرفی کسب‌وکارهای دیگر):", "") || "";
    const response = await fetch("/api/admin/businesses/" + id + "/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode, durationDays, durationMonths, note }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.ok) {
      setMessage("تغییر پلن انجام نشد.");
      return;
    }

    setMessage(
      planCode === "free"
        ? "کسب‌وکار به پلن پایه برگشت."
        : "پلن " + (result.plan?.name || planCode) + " برای " + durationDays + " روز به‌صورت مدیریتی فعال شد."
    );
    await load();
  }

  async function lifecycle(item: BusinessRow, action: "remove" | "restore" | "purge") {
    setMessage("");

    let reason = "";
    let confirmationName = "";
    if (action === "remove") {
      reason = window.prompt("دلیل توقف و اصلاح موردنیاز را بنویسید:", "") || "";
      if (reason.trim().length<3) {setMessage('توقف بدون دلیل ثبت نمی‌شود.');return;}
      if (!window.confirm("کسب‌وکار «" + item.name + "» از سایت و دسته‌بندی‌ها حذف و دسترسی غرفه مسدود شود؟ اطلاعات برای بازگردانی باقی می‌ماند.")) return;
    }

    if (action === "restore") {
      if (!window.confirm("پروفایل «" + item.name + "» دوباره به سایت برگردد؟")) return;
    }

    if (action === "purge") {
      const confirmation = window.prompt(
        "حذف دائمی قابل برگشت نیست. برای تأیید، نام کسب‌وکار را دقیق وارد کنید:",
        ""
      );
      if (confirmation !== item.name) {
        setMessage("حذف دائمی لغو شد؛ نام واردشده با نام کسب‌وکار یکسان نبود.");
        return;
      }
      confirmationName = confirmation;
      reason = "permanent admin purge";
    }

    setBusyId(item.id);
    try {
    const response = await fetch("/api/admin/businesses/" + item.id + "/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, confirmationName }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.ok) {
      if (result?.error === "FINANCIAL_RECORDS_MUST_BE_RETAINED") {
        setMessage("این کسب‌وکار سابقه مالی دارد؛ از سایت حذف می‌ماند اما سوابق مالی و حسابرسی نباید پاک شوند.");
      } else if (result?.error === "MEDIA_CLEANUP_FAILED") {
        setMessage("پاک‌کردن عکس‌ها کامل نشد؛ کسب‌وکار همچنان از سایت حذف است. دوباره تلاش کنید.");
      } else {
        setMessage("عملیات حذف/بازگردانی انجام نشد.");
      }
      return;
    }

    setMessage(
      action === "remove"
        ? "کسب‌وکار فوراً از نمایش عمومی حذف شد."
        : action === "restore"
          ? "کسب‌وکار دوباره فعال شد."
          : "کسب‌وکار به‌صورت دائمی حذف شد."
    );
    await load();
    } catch {
      setMessage("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const filteredItems = items.filter((item) => {
    if ((item.status === "suspended") !== showRemoved) return false;
    const needle = query.trim().toLowerCase();
    return !needle || [item.name, item.owner_name, item.owner_phone, item.phone].filter(Boolean).join(" ").toLowerCase().includes(needle);
  });

  return (
    <div className="admin-moderation">
      <div className="dashboard-heading">
        <div>
          <span className="section-kicker">مدیریت داخلی خونه نما</span>
          <h1>بررسی کسب‌وکارها</h1>
          <p>پروفایل‌های در انتظار بررسی را تأیید، رد یا برای اصلاح برگردان.</p>
        </div>
        <div className="dashboard-heading-actions">
          <a className="pill-button" href="/admin/reviews">مدیریت نظرها</a>
          <button className="pill-button" type="button" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> بروزرسانی
          </button>
          <button className="pill-button" type="button" onClick={logout}>
            <LogOut size={15} /> خروج
          </button>
        </div>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-summary-grid">
        <div><strong>{Number(summary.total || 0).toLocaleString("fa-IR")}</strong><span>کل کسب‌وکارها</span></div>
        <div><strong>{Number(summary.pending || 0).toLocaleString("fa-IR")}</strong><span>منتظر بررسی</span></div>
        <div><strong>{Number(summary.active_subscriptions || 0).toLocaleString("fa-IR")}</strong><span>اشتراک فعال</span></div>
        <div><strong>{Number(summary.paid_count || 0).toLocaleString("fa-IR")}</strong><span>پرداخت موفق</span></div>
        <div><strong>{Number(summary.revenue || 0).toLocaleString("fa-IR")}</strong><span>درآمد ثبت‌شده (تومان)</span></div>
      </div>

      <div className="admin-search-box">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو بین نام کسب‌وکار یا مالک؛ مثلاً مهرعلی علایی"
        />
      </div>
      <div className="dashboard-heading-actions" role="group" aria-label="فیلتر کسب‌وکارها">
        <button type="button" className={"pill-button" + (!showRemoved ? " dark" : "")} aria-pressed={!showRemoved} onClick={() => setShowRemoved(false)}>کسب‌وکارهای موجود</button>
        <button type="button" className={"pill-button" + (showRemoved ? " dark" : "")} aria-pressed={showRemoved} onClick={() => setShowRemoved(true)}>حذف‌شده‌ها و مسدودشده‌ها</button>
      </div>

      {loading ? (
        <div className="dashboard-panel glass-panel admin-loading">در حال دریافت اطلاعات...</div>
      ) : (
        <div className="admin-business-list">
          {filteredItems.map((item) => (
            <article className={"admin-business-card glass-panel status-" + item.status} key={item.id}>
              <div className="admin-business-card-head">
                <div>
                  <span className="status-pill">{statusLabels[item.status] || item.status}</span>
                  <h2>{item.name}</h2>
                  <small>{item.category_name || "بدون دسته"} · {item.city}، {item.area || "—"}</small>
                </div>
                <span className="admin-business-id">#{item.id}</span>
              </div>

              <p>{item.description || "توضیحی ثبت نشده است."}</p>

              <div className="admin-business-meta">
                <span>مالک: {item.owner_name || "—"}</span>
                <span>موبایل: {item.owner_phone || item.phone || "—"}</span>
                <span>وضعیت تأیید: {statusLabels[item.verification_status] || item.verification_status}</span>
                <span className={item.has_password ? "admin-auth-chip has-password" : "admin-auth-chip"}>
                  <KeyRound size={12} /> {item.has_password ? "رمز فعال" : "حساب قدیمی بدون رمز"}
                </span>
                <span className={"admin-plan-chip plan-" + (item.plan_code || "free")}>
                  پلن: {item.plan_name || "پایه"}
                </span>
                {item.subscription_ends_at && <span>پایان اشتراک: {new Date(item.subscription_ends_at).toLocaleDateString("fa-IR")}</span>}
                {item.complimentary ? <span className="admin-gift-chip">فعال‌سازی مدیریتی/هدیه</span> : null}
                {item.last_payment_status && <span className={"admin-payment-chip status-" + item.last_payment_status}>پرداخت: {statusLabels[item.last_payment_status] || item.last_payment_status}؛ مبلغ و واحد پول در فهرست پرداخت‌ها</span>}
                {item.last_payment_reference && <span>پیگیری: {item.last_payment_reference}</span>}
              </div>

              <div className="admin-plan-test-box">
                <div>
                  <FlaskConical size={16} />
                  <span>
                    <strong>مدیریت پلن و آفر</strong>
                    <small>فعال‌سازی دستی، هدیه یا همکاری؛ علت در سوابق ثبت می‌شود</small>
                  </span>
                </div>
                <div className="admin-plan-test-actions">
                  <button type="button" onClick={()=>setTestPlan(item.id,"pro",60)}>هدیه حرفه‌ای ۶۰روزه</button>
                  <button type="button" onClick={()=>setTestPlan(item.id,"pro",90)}>هدیه حرفه‌ای ۹۰روزه</button>
                  <button type="button" className={(item.plan_code || "free") === "free" ? "is-active" : ""} onClick={() => setTestPlan(item.id, "free")}>
                    پایه
                  </button>
                  <button type="button" className={item.plan_code === "pro" ? "is-active" : ""} onClick={() => setTestPlan(item.id, "pro")}>
                    <Sparkles size={13} /> حرفه‌ای
                  </button>
                  <button type="button" className={item.plan_code === "premium" ? "is-active premium" : ""} onClick={() => setTestPlan(item.id, "premium")}>
                    <Crown size={13} /> ویژه
                  </button>
                </div>
              </div>

              <div className="admin-business-actions">
                <AdminBusinessHistory id={item.id} />
                {item.status === "published" && (
                  <a className="pill-button" href={"/business/" + item.slug} target="_blank" rel="noreferrer">
                    <Store size={15} /> مشاهده صفحه عمومی
                  </a>
                )}
                {item.status !== "suspended" ? (
                  <button className="pill-button admin-reject" type="button" disabled={busyId === item.id} onClick={() => lifecycle(item, "remove")}>
                    <Trash2 size={15} /> حذف از سایت
                  </button>
                ) : (
                  <>
                    <button className="pill-button" type="button" disabled={busyId === item.id} onClick={() => lifecycle(item, "restore")}>
                      <RotateCcw size={15} /> بازگردانی
                    </button>
                    <button className="pill-button admin-purge" type="button" disabled={busyId === item.id} onClick={() => lifecycle(item, "purge")}>
                      <Trash2 size={15} /> حذف دائمی
                    </button>
                  </>
                )}
                {item.status !== "suspended" && (item.status === "pending" || item.review_status === "pending" || item.verification_status === "unverified") && (
                  <>
                    <button className="pill-button admin-reject" type="button" onClick={() => review(item.id, "reject")}>
                      <XCircle size={15} /> رد درخواست تأیید
                    </button>
                    <button className="pill-button dark" type="button" onClick={() => review(item.id, "approve")}>
                      <CheckCircle2 size={15} /> تأیید کسب‌وکار
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}

          {!filteredItems.length && (
            <div className="dashboard-panel glass-panel admin-loading">هیچ کسب‌وکاری برای نمایش وجود ندارد.</div>
          )}
        </div>
      )}
    </div>
  );
}
