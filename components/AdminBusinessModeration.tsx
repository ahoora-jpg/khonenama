"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, RefreshCw, Store, XCircle } from "lucide-react";

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
};

export default function AdminBusinessModeration() {
  const [items, setItems] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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

    setMessage(action === "approve" ? "کسب‌وکار منتشر شد." : "کسب‌وکار برای اصلاح به پیش‌نویس برگشت.");
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

      {loading ? (
        <div className="dashboard-panel glass-panel admin-loading">در حال دریافت اطلاعات...</div>
      ) : (
        <div className="admin-business-list">
          {items.map((item) => (
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
              </div>

              <div className="admin-business-actions">
                {item.status === "published" && (
                  <a className="pill-button" href={"/business/" + item.slug} target="_blank" rel="noreferrer">
                    <Store size={15} /> مشاهده صفحه عمومی
                  </a>
                )}
                {item.status === "pending" && (
                  <>
                    <button className="pill-button admin-reject" type="button" onClick={() => review(item.id, "reject")}>
                      <XCircle size={15} /> برگشت برای اصلاح
                    </button>
                    <button className="pill-button dark" type="button" onClick={() => review(item.id, "approve")}>
                      <CheckCircle2 size={15} /> تأیید و انتشار
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
