"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock3, Send, ShieldCheck } from "lucide-react";

type Status = "draft" | "pending" | "published" | "suspended" | "";

export default function BusinessPublicationPanel({
  initialStatus = "",
  initialVerificationStatus = "",
}: {
  initialStatus?: Status;
  initialVerificationStatus?: string;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [verificationStatus, setVerificationStatus] = useState(initialVerificationStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setVerificationStatus(initialVerificationStatus || "");
  }, [initialVerificationStatus]);

  async function submitForVerification() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/me/business/submit-review", { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        if (result?.error === "PROFILE_INCOMPLETE") {
          setMessage("پروفایل برای درخواست نشان تأیید هنوز کامل نیست. اطلاعات، خدمات و محدوده را تکمیل کنید.");
        } else if (result?.error === "UNAUTHENTICATED") {
          setMessage("برای ادامه دوباره وارد پنل شوید.");
        } else {
          setMessage("ارسال درخواست تأیید انجام نشد. دوباره تلاش کنید.");
        }
        return;
      }
      setStatus(result.status || status);
      setVerificationStatus(result.verificationStatus || "pending");
      setMessage("درخواست نشان تأیید ثبت شد. پروفایل شما در این فاصله همچنان منتشر می‌ماند.");
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "suspended") {
    return (
      <section className="dashboard-panel glass-panel publication-panel">
        <ShieldCheck size={22} />
        <div>
          <span className="section-kicker">وضعیت پروفایل</span>
          <h2>نمایش عمومی متوقف شده</h2>
          <p>این پروفایل توسط مدیریت از نمایش عمومی خارج شده است.</p>
        </div>
      </section>
    );
  }

  if (verificationStatus === "verified" || verificationStatus === "professional") {
    return (
      <section className="dashboard-panel glass-panel publication-panel is-published">
        <BadgeCheck size={22} />
        <div>
          <span className="section-kicker">اعتماد و اعتبار</span>
          <h2>کسب‌وکار تأیید شده</h2>
          <p>نشان تأیید خونه‌نما برای این کسب‌وکار فعال است.</p>
        </div>
      </section>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <section className="dashboard-panel glass-panel publication-panel is-pending">
        <Clock3 size={22} />
        <div>
          <span className="section-kicker">اعتماد و اعتبار</span>
          <h2>درخواست تأیید در حال بررسی است</h2>
          <p>پروفایل شما منتشر است و بررسی برای دریافت نشان تأیید جداگانه انجام می‌شود.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel glass-panel publication-panel is-published">
      <CheckCircle2 size={22} />
      <div>
        <span className="section-kicker">وضعیت پروفایل</span>
        <h2>پروفایل شما منتشر است</h2>
        <p>
          برای انتشار و گرفتن لینک نیازی به تأیید مدیریت نیست. در صورت تمایل می‌توانید
          جداگانه برای نشان تأیید خونه‌نما درخواست بدهید.
        </p>
        <button className="pill-button dark" type="button" onClick={submitForVerification} disabled={loading}>
          {loading ? "در حال ارسال..." : "درخواست نشان تأیید"} <Send size={15} />
        </button>
        {message && <small className="publication-message">{message}</small>}
      </div>
    </section>
  );
}
