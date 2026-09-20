"use client";

import { useEffect, useState } from "react";
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
};

export default function AdminBusinessModeration() {
  const [items, setItems] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/businesses", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");
      setItems(result.businesses || []);
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

  async function setTestPlan(id: number, planCode: "free" | "pro" | "premium") {
    setMessage("");
    const response = await fetch("/api/admin/businesses/" + id + "/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.ok) {
      setMessage("تغییر آزمایشی پلن انجام نشد.");
      return;
    }

    setMessage(
      planCode === "free"
        ? "کسب‌وکار به پلن پایه برگشت."
        : "پلن " + (result.plan?.name || planCode) + " برای ۳۰ روز در حالت آزمایشی فعال شد."
    );
    await load();
  }

  async function lifecycle(item: BusinessRow, action: "remove" | "restore" | "purge") {
    setMessage("");

    let reason = "";
    if (action === "remove") {
      reason = window.prompt("دلیل حذف از سایت را بنویسید:", "") || "";
      if (!window.confirm("پروفایل «" + item.name + "» فوراً از نمایش عمومی حذف شود؟")) return;
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
      reason = "permanent admin purge";
    }

    const response = await fetch("/api/admin/businesses/" + item.id + "/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.ok) {
      if (result?.error === "FINANCIAL_RECORDS_MUST_BE_RETAINED") {
        setMessage("این کسب‌وکار سابقه مالی دارد؛ از سایت حذف می‌ماند اما سوابق مالی و حسابرسی نباید پاک شوند.");
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
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="admin-moderation">
      <div className="dashboard-heading">
        <div>
          <span className="section-kicker">مدیریت داخلی خونه‌نما</span>
          <h1>بررسی کسب‌وکارها</h1>
          <p>پروفایل‌های در انتظار بررسی را تأیید، رد یا برای اصلاح برگردان.</p>
        </div>
        <div className="dashboard-heading-actions">
          <button className="pill-button" type="button" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> بروزرسانی
          </button>
          <button className="pill-button" type="button" onClick={logout}>
            <LogOut size={15} /> خروج
          </button>
        </div>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-search-box">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو بین نام کسب‌وکار یا مالک؛ مثلاً مهرعلی علایی"
        />
      </div>

      {loading ? (
        <div className="dashboard-panel glass-panel admin-loading">در حال دریافت اطلاعات...</div>
      ) : (
        <div className="admin-business-list">
          {items
            .filter((item) => {
              const needle = query.trim().toLowerCase();
              if (!needle) return true;
              return [item.name, item.owner_name, item.owner_phone, item.phone]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(needle);
            })
            .map((item) => (
            <article className={"admin-business-card glass-panel status-" + item.status} key={item.id}>
              <div className="admin-business-card-head">
                <div>
                  <span className="status-pill">{item.status}</span>
                  <h2>{item.name}</h2>
                  <small>{item.category_name || "بدون دسته"} · {item.city}، {item.area || "—"}</small>
                </div>
                <span className="admin-business-id">#{item.id}</span>
              </div>

              <p>{item.description || "توضیحی ثبت نشده است."}</p>

              <div className="admin-business-meta">
                <span>مالک: {item.owner_name || "—"}</span>
                <span>موبایل: {item.owner_phone || item.phone || "—"}</span>
                <span>وضعیت تأیید: {item.verification_status}</span>
                <span className={item.has_password ? "admin-auth-chip has-password" : "admin-auth-chip"}>
                  <KeyRound size={12} /> {item.has_password ? "رمز فعال" : "حساب قدیمی بدون رمز"}
                </span>
                <span className={"admin-plan-chip plan-" + (item.plan_code || "free")}>
                  پلن: {item.plan_name || "پایه"}
                </span>
              </div>

              <div className="admin-plan-test-box">
                <div>
                  <FlaskConical size={16} />
                  <span>
                    <strong>پیش‌نمایش درآمدی</strong>
                    <small>فقط برای تست داخلی؛ بدون پرداخت واقعی</small>
                  </span>
                </div>
                <div className="admin-plan-test-actions">
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
                {item.status === "published" && (
                  <a className="pill-button" href={"/business/" + item.slug} target="_blank" rel="noreferrer">
                    <Store size={15} /> مشاهده صفحه عمومی
                  </a>
                )}
                {item.status !== "suspended" ? (
                  <button className="pill-button admin-reject" type="button" onClick={() => lifecycle(item, "remove")}>
                    <Trash2 size={15} /> حذف از سایت
                  </button>
                ) : (
                  <>
                    <button className="pill-button" type="button" onClick={() => lifecycle(item, "restore")}>
                      <RotateCcw size={15} /> بازگردانی
                    </button>
                    <button className="pill-button admin-purge" type="button" onClick={() => lifecycle(item, "purge")}>
                      <Trash2 size={15} /> حذف دائمی
                    </button>
                  </>
                )}
                {item.status === "pending" && (
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

          {!items.length && (
            <div className="dashboard-panel glass-panel admin-loading">هیچ کسب‌وکاری برای نمایش وجود ندارد.</div>
          )}
        </div>
      )}
    </div>
  );
}
