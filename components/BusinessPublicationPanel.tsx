"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Send, ShieldCheck } from "lucide-react";

type Status = "draft" | "pending" | "published" | "suspended" | "";

export default function BusinessPublicationPanel({ initialStatus = "" }: { initialStatus?: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  async function submitForReview() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/me/business/submit-review", { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        if (result?.error === "PROFILE_INCOMPLETE") {
          setMessage("پروفایل هنوز برای بررسی کامل نیست. اطلاعات، خدمات و محدوده فعالیت را تکمیل کنید.");
        } else if (result?.error === "UNAUTHENTICATED") {
          setMessage("Session پنل فعال نیست؛ یک‌بار دوباره ثبت‌نام یا ورود انجام دهید.");
        } else {
          setMessage("ارسال برای بررسی انجام نشد. دوباره تلاش کنید.");
        }
        return;
      }
      setStatus(result.status);
      setMessage("پروفایل برای بررسی خونه‌نما ارسال شد.");
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "published") {
    return (
      <section className="dashboard-panel glass-panel publication-panel is-published">
        <CheckCircle2 size={22} />
        <div>
          <span className="section-kicker">وضعیت انتشار</span>
          <h2>پروفایل منتشر شده</h2>
          <p>پروفایل شما در صفحات عمومی خونه‌نما قابل نمایش است.</p>
        </div>
      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="dashboard-panel glass-panel publication-panel is-pending">
        <Clock3 size={22} />
        <div>
          <span className="section-kicker">وضعیت انتشار</span>
          <h2>در انتظار بررسی</h2>
          <p>اطلاعات برای بررسی ارسال شده و تا تصمیم نهایی به‌صورت عمومی منتشر نمی‌شود.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel glass-panel publication-panel">
      <ShieldCheck size={22} />
      <div>
        <span className="section-kicker">مرحله بعد</span>
        <h2>ارسال پروفایل برای بررسی</h2>
        <p>بعد از تکمیل اطلاعات، پروفایل را برای بررسی و انتشار عمومی ارسال کنید.</p>
        <button className="pill-button dark" type="button" onClick={submitForReview} disabled={loading}>
          {loading ? "در حال ارسال..." : "ارسال برای بررسی"} <Send size={15} />
        </button>
        {message && <small className="publication-message">{message}</small>}
      </div>
    </section>
  );
}
