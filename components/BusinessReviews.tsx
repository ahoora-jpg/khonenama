"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, ShieldCheck, Star } from "lucide-react";

type PublicReview = {
  id: number;
  name: string;
  rating: number;
  body: string;
  verifiedInteraction: boolean;
  createdAt: string;
};

export default function BusinessReviews({
  businessSlug,
  businessName,
  reviews,
  rating,
  reviewCount,
  demo = false,
}: {
  businessSlug: string;
  businessName: string;
  reviews: PublicReview[];
  rating: number;
  reviewCount: number;
  demo?: boolean;
}) {
  const [reviewerName, setReviewerName] = useState("");
  const [selectedRating, setSelectedRating] = useState(5);
  const [body, setBody] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const averageLabel = useMemo(
    () => (reviewCount > 0 ? new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(rating) : "جدید"),
    [rating, reviewCount]
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (reviewerName.trim().length < 2) {
      setMessage("نام را کامل وارد کنید.");
      return;
    }
    if (body.trim().length < 10) {
      setMessage("لطفاً تجربه خود را کمی کامل‌تر بنویسید.");
      return;
    }
    if (requestCode.trim() && customerPhone.trim().length < 10) {
      setMessage("برای تأیید خرید یا تعامل، شماره همراه همان درخواست را وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/business/" + encodeURIComponent(businessSlug) + "/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName,
          rating: selectedRating,
          body,
          requestCode,
          customerPhone,
          website,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        const messages: Record<string, string> = {
          INVALID_NAME: "نام را کامل وارد کنید.",
          INVALID_RATING: "امتیاز معتبر نیست.",
          REVIEW_TOO_SHORT: "متن نظر خیلی کوتاه است.",
          INVALID_REQUEST_CODE: "کد درخواست یا شماره همراه کامل نیست.",
          REQUEST_NOT_MATCHED: "کد درخواست با این کسب‌وکار یا شماره همراه مطابقت ندارد.",
          REQUEST_ALREADY_REVIEWED: "برای این درخواست قبلاً نظر ثبت شده است.",
          RECENT_DUPLICATE: "یک نظر مشابه اخیراً با همین نام ثبت شده است.",
        };
        setMessage(messages[result?.error] || "ثبت نظر انجام نشد. دوباره تلاش کنید.");
        return;
      }

      setSuccess(true);
      setReviewerName("");
      setBody("");
      setRequestCode("");
      setCustomerPhone("");
      setSelectedRating(5);
      setMessage(
        result.verifiedInteraction
          ? "نظر شما با نشان تعامل تأییدشده ثبت شد و بعد از بررسی منتشر می‌شود."
          : "نظر شما ثبت شد و بعد از بررسی خونه‌نما منتشر می‌شود."
      );
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="profile-section business-reviews-section" id="reviews">
      <div className="reviews-heading">
        <div>
          <span className="section-kicker">تجربه مشتریان</span>
          <h2>نظرها و امتیازها</h2>
        </div>
        <div className="reviews-score">
          <Star size={18} fill="currentColor" />
          <strong>{averageLabel}</strong>
          <small>{reviewCount ? new Intl.NumberFormat("fa-IR").format(reviewCount) + " نظر منتشرشده" : "هنوز نظری منتشر نشده"}</small>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="public-review-grid">
          {reviews.map((review) => (
            <article className="public-review-card glass-panel" key={review.id}>
              <div className="public-review-card-head">
                <div>
                  <strong>{review.name}</strong>
                  {review.verifiedInteraction && (
                    <span className="verified-interaction-badge">
                      <BadgeCheck size={12} /> تعامل تأییدشده
                    </span>
                  )}
                </div>
                <span className="review-stars" aria-label={review.rating + " از ۵"}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={12} fill={index < review.rating ? "currentColor" : "none"} />
                  ))}
                </span>
              </div>
              <p>{review.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="reviews-empty glass-panel">
          <Star size={20} />
          <span>اولین نظر واقعی هنوز منتشر نشده است.</span>
        </div>
      )}

      {demo ? (
        <div className="demo-review-note glass-panel">
          این صفحه نمونه است؛ نظر واقعی فقط برای کسب‌وکارهای ثبت‌شده پذیرفته می‌شود.
        </div>
      ) : (
        <form className="review-submit-card glass-panel" onSubmit={submit}>
          <div className="review-submit-heading">
            <div>
              <span className="section-kicker">نظر شما</span>
              <h3>تجربه‌ات از {businessName} را ثبت کن</h3>
            </div>
            <ShieldCheck size={21} />
          </div>

          <div className="review-form-grid">
            <label>
              <span>نام نمایشی</span>
              <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="مثلاً علی رضایی" />
            </label>

            <div className="review-rating-field">
              <span>امتیاز</span>
              <div className="review-rating-picker">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={value <= selectedRating ? "is-active" : ""}
                    onClick={() => setSelectedRating(value)}
                    aria-label={value + " ستاره"}
                  >
                    <Star size={18} fill={value <= selectedRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            <label className="review-wide">
              <span>نظر شما</span>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="کیفیت کار، خوش‌قولی، ارتباط و تجربه واقعی خودت را بنویس."
              />
            </label>

            <label>
              <span>کد درخواست خونه‌نما ـ اختیاری</span>
              <input dir="ltr" value={requestCode} onChange={(e) => setRequestCode(e.target.value)} placeholder="KH-000001" />
              <small>اگر از خونه‌نما درخواست قیمت داده‌ای، با این کد نظر «تعامل تأییدشده» می‌گیرد.</small>
            </label>

            <label>
              <span>شماره همراه همان درخواست ـ فقط برای تأیید</span>
              <input dir="ltr" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09..." />
              <small>شماره روی نظر یا صفحه عمومی نمایش داده نمی‌شود.</small>
            </label>

            <label className="review-honeypot" aria-hidden="true">
              <span>وب‌سایت</span>
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          {message && (
            <div className={success ? "review-submit-message is-success" : "review-submit-message"} role="status">
              {success && <CheckCircle2 size={14} />}
              {message}
            </div>
          )}

          <button className="pill-button dark" type="submit" disabled={loading}>
            {loading ? "در حال ثبت..." : "ثبت نظر برای بررسی"}
          </button>
        </form>
      )}
    </section>
  );
}
