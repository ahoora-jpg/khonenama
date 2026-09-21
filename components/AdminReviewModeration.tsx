"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CheckCircle2, RefreshCw, Star, XCircle } from "lucide-react";

type ReviewRow = {
  id: number;
  business_id: number;
  rating: number;
  title: string;
  body: string;
  status: string;
  verified_interaction: number;
  created_at: string;
  business_name: string;
  business_slug: string;
};

export default function AdminReviewModeration() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");
      setItems(result.reviews || []);
    } catch {
      setMessage("دریافت نظرها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(reviewId: number, action: "approve" | "reject") {
    const response = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, action }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      setMessage("ثبت تصمیم انجام نشد.");
      return;
    }
    setMessage(action === "approve" ? "نظر منتشر شد." : "نظر رد شد.");
    await load();
  }

  return (
    <div className="admin-moderation">
      <div className="dashboard-heading">
        <div>
          <span className="section-kicker">اعتماد و کیفیت محتوا</span>
          <h1>مدیریت نظرهای کاربران</h1>
          <p>نظرهای واقعی را قبل از انتشار بررسی کن؛ امتیاز و نشان تعامل قابل خرید نیست.</p>
        </div>
        <div className="dashboard-heading-actions">
          <a className="pill-button" href="/admin/businesses">کسب‌وکارها</a>
          <button className="pill-button" type="button" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> بروزرسانی
          </button>
        </div>
      </div>

      {message && <div className="admin-message">{message}</div>}

      {loading ? (
        <div className="dashboard-panel glass-panel admin-loading">در حال دریافت نظرها...</div>
      ) : (
        <div className="admin-review-list">
          {items.map((item) => (
            <article className={"admin-review-card glass-panel status-" + item.status} key={item.id}>
              <div className="admin-review-head">
                <div>
                  <span className="status-pill">{item.status}</span>
                  <h2>{item.title || "کاربر خونه‌نما"}</h2>
                  <a href={"/business/" + item.business_slug} target="_blank" rel="noreferrer">{item.business_name}</a>
                </div>
                <div className="admin-review-rating">
                  <Star size={15} fill="currentColor" />
                  <strong>{item.rating}</strong>
                </div>
              </div>

              {item.verified_interaction ? (
                <span className="verified-interaction-badge"><BadgeCheck size={12} /> تعامل تأییدشده</span>
              ) : (
                <span className="unverified-review-badge">بدون کد تعامل</span>
              )}

              <p>{item.body}</p>

              {item.status === "pending" && (
                <div className="admin-business-actions">
                  <button className="pill-button admin-reject" type="button" onClick={() => decide(item.id, "reject")}>
                    <XCircle size={15} /> رد
                  </button>
                  <button className="pill-button dark" type="button" onClick={() => decide(item.id, "approve")}>
                    <CheckCircle2 size={15} /> تأیید و انتشار
                  </button>
                </div>
              )}
            </article>
          ))}

          {!items.length && (
            <div className="dashboard-panel glass-panel admin-loading">هنوز نظری ثبت نشده است.</div>
          )}
        </div>
      )}
    </div>
  );
}
