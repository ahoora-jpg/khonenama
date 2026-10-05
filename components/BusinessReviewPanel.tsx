"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, MessageSquareText, Star } from "lucide-react";

type OwnerReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  reply?: string;
  status: string;
  verified_interaction: number;
  created_at: string;
};

export default function BusinessReviewPanel() {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [summary, setSummary] = useState({ published: 0, pending: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function reply(review: OwnerReview) {
    setSaving(review.id); setMessage("");
    try {
      const body = (drafts[review.id] ?? review.reply ?? "").trim();
      const response = await fetch("/api/me/business/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId: review.id, body }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error();
      setReviews(items => items.map(item => item.id === review.id ? { ...item, reply: body } : item));
      setMessage("پاسخ ذخیره شد و در صفحه غرفه نمایش داده می‌شود.");
    } catch { setMessage("پاسخ ذخیره نشد؛ متن باید بین ۳ و ۱۵۰۰ نویسه باشد."); }
    finally { setSaving(null); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/business/reviews", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled && result?.ok) {
          setReviews(result.reviews || []);
          setSummary(result.summary || { published: 0, pending: 0, average: 0 });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="dashboard-panel glass-panel business-review-panel" id="reviews">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">اعتماد مشتریان</span>
          <h2>نظرها و امتیازها</h2>
        </div>
        <MessageSquareText size={20} />
      </div>

      <div className="owner-review-summary">
        <span><Star size={14} fill={summary.published ? "currentColor" : "none"} /> میانگین {summary.published ? summary.average.toFixed(1) : "—"}</span>
        <span>{summary.published} منتشرشده</span>
        <span>{summary.pending} در انتظار بررسی</span>
      </div>
      {message && <p role="status">{message}</p>}

      {loading ? (
        <div className="dashboard-empty-state"><strong>در حال دریافت نظرها...</strong></div>
      ) : reviews.length ? (
        <div className="owner-review-list">
          {reviews.slice(0, 6).map((review) => (
            <article key={review.id}>
              <div>
                <strong>{review.title || "مشتری خونه نما"}</strong>
                {review.verified_interaction ? (
                  <span className="verified-interaction-badge"><BadgeCheck size={11} /> درخواست ثبت‌شده</span>
                ) : null}
              </div>
              <span className="review-stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={11} fill={index < review.rating ? "currentColor" : "none"} />
                ))}
              </span>
              <p>{review.body}</p>
              {review.status === "published" && <div><label>پاسخ شما<textarea maxLength={1500} value={drafts[review.id] ?? review.reply ?? ""} onChange={event => setDrafts(items => ({ ...items, [review.id]: event.target.value }))} /></label><button type="button" disabled={saving !== null} onClick={() => reply(review)}>{saving === review.id ? "در حال ذخیره…" : "ثبت پاسخ"}</button></div>}
              <small>{review.status === "published" ? "منتشرشده" : review.status === "pending" ? "در انتظار بررسی" : "منتشرنشده"}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <MessageSquareText size={22} />
          <strong>هنوز نظری ثبت نشده</strong>
          <small>نظرهای مشتریان پس از بررسی خونه نما در این بخش و صفحه عمومی نمایش داده می‌شوند.</small>
        </div>
      )}
    </section>
  );
}
