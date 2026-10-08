"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock3, Send, ShieldCheck } from "lucide-react";

type Status = "draft" | "pending" | "published" | "suspended" | "";

export default function BusinessPublicationPanel({
  initialStatus = "",
  initialVerificationStatus = "",
  initialModerationReason = "",
}: {
  initialStatus?: Status;
  initialVerificationStatus?: string;
  initialModerationReason?: string;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [verificationStatus, setVerificationStatus] = useState(initialVerificationStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function publish() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/me/business", {method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"publish"})});
      const result = await response.json();
      if (!response.ok || !result.ok) { setMessage(result.missing?.length ? "برای انتشار تکمیل کنید: " + result.missing.join("، ") : "انتشار انجام نشد؛ وضعیت را از پشتیبانی پیگیری کنید."); return; }
      setStatus("published"); setMessage("غرفه منتشر شد؛ اکنون از لینک عمومی قابل مشاهده است.");
      window.dispatchEvent(new Event("khonenama-business-updated"));
    } catch { setMessage("ارتباط برقرار نشد؛ اطلاعات شما حفظ شده است."); }
    finally { setLoading(false); }
  }

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
          <p>دلیل: {initialModerationReason || "برای دریافت توضیح با پشتیبانی تماس بگیرید."} برای اصلاح یا اعتراض از <a href="/support">پشتیبانی با موضوع اعتراض به وضعیت غرفه</a> استفاده کنید.</p>
        </div>
      </section>
    );
  }

  if (!status) return <section className="dashboard-panel glass-panel publication-panel"><p role="status">در حال دریافت وضعیت انتشار غرفه...</p></section>;
  if (status !== "published") {
    return <section className="dashboard-panel glass-panel publication-panel"><Clock3 size={22} /><div><span className="section-kicker">وضعیت انتشار غرفه</span><h2>{status === "pending" ? "در انتظار بررسی انتشار" : "غرفه هنوز منتشر نشده است"}</h2><p>{initialModerationReason || "دسته فعالیت، خدمات اصلی، محدوده فعالیت و معرفی کسب‌وکار را تکمیل کنید؛ پیشنهاد دسته جدید تا بررسی و انتخاب دسته موجود، پیش‌نویس می‌ماند."}</p><a className="pill-button" href="/dashboard/profile">تکمیل اطلاعات</a>{status === "draft" && <button type="button" className="pill-button dark" disabled={loading} onClick={publish}>{loading ? "در حال بررسی..." : "بررسی و انتشار غرفه"}</button>}<a href="/support"> پیگیری از پشتیبانی</a>{message && <p role="status">{message}</p>}</div></section>;
  }

  if (verificationStatus === "verified" || verificationStatus === "professional") {
    return (
      <section className="dashboard-panel glass-panel publication-panel is-published">
        <BadgeCheck size={22} />
        <div>
          <span className="section-kicker">اعتماد و اعتبار</span>
          <h2>کسب‌وکار تأیید شده</h2>
          <p>نشان تأیید خونه نما برای این کسب‌وکار فعال است.</p>
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
          جداگانه برای نشان تأیید خونه نما درخواست بدهید.
        </p>
        <button className="pill-button dark" type="button" onClick={submitForVerification} disabled={loading}>
          {loading ? "در حال ارسال..." : "درخواست نشان تأیید"} <Send size={15} />
        </button>
        {message && <small className="publication-message">{message}</small>}
      </div>
    </section>
  );
}
