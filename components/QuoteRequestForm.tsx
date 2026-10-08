"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LockKeyhole, MessageCircle, Send } from "lucide-react";

function track(slug: string, event: string) {
  fetch("/api/business/" + encodeURIComponent(slug) + "/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}

function normalizedPhone(value: string) {
  const digits = value.replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[^\d+]/g, "");
  return digits.replace(/^\+?98/, "0");
}

export default function QuoteRequestForm({
  businessSlug,
  businessName,
  services = [],
}: {
  businessSlug: string;
  businessName: string;
  services?: string[];
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [area, setArea] = useState("");
  const [requestText, setRequestText] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [service, setService] = useState("");
  const started = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chosen = params.get("service") || params.get("q") || "";
    if (services.includes(chosen)) setService(chosen);
    setArea((params.get("location") || "").slice(0, 100));
  }, [services.join("|")]);
  function start() {
    if (!started.current) { started.current = true; track(businessSlug, "quote_start"); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setRequestCode("");

    if (customerName.trim().length < 2) {
      setMessage("نام را کامل وارد کنید.");
      return;
    }
    if (!/^09\d{9}$/.test(normalizedPhone(customerPhone))) {
      setMessage("شماره همراه معتبر را به صورت 09xxxxxxxxx وارد کنید.");
      return;
    }
    if (requestText.trim().length < 10) {
      setMessage("لطفاً کمی بیشتر درباره نیازتان توضیح دهید.");
      return;
    }

    start();
    setLoading(true);
    try {
      const response = await fetch("/api/business/" + encodeURIComponent(businessSlug) + "/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          area,
          requestText: service ? "خدمت: " + service + "\n" + requestText : requestText,
          budgetMin,
          budgetMax,
          website,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        const errors: Record<string, string> = {
          INVALID_NAME: "نام را کامل وارد کنید.",
          INVALID_PHONE: "شماره همراه معتبر نیست.",
          REQUEST_TOO_SHORT: "توضیح درخواست خیلی کوتاه است.",
          INVALID_BUDGET: "بازه بودجه واردشده معتبر نیست.",
          RECENT_DUPLICATE: "درخواست شما در چند دقیقه اخیر ثبت شده است؛ برای پاسخ، کد پیگیری قبلی را بررسی کنید.",
          RATE_LIMITED: "تعداد تلاش‌ها زیاد شده است؛ کمی بعد دوباره امتحان کنید. اطلاعات شما حفظ شده است.",
          TOO_MANY_ATTEMPTS: "تعداد تلاش‌ها زیاد شده است؛ ۱۵ دقیقه بعد دوباره امتحان کنید. اطلاعات شما حفظ شده است.",
          BUSINESS_NOT_FOUND: "این کسب‌وکار در حال حاضر درخواست جدید دریافت نمی‌کند.",
        };
        setMessage(errors[result?.error] || "ثبت درخواست انجام نشد. دوباره تلاش کنید.");
        return;
      }

      track(businessSlug, "quote_sent");
      setRequestCode(result.requestCode || "");
      setCustomerName("");
      setCustomerPhone("");
      setArea("");
      setRequestText("");
      setBudgetMin("");
      setBudgetMax("");
    } catch {
      setMessage("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  if (requestCode) {
    return (
      <div className="quote-success glass-panel">
        <CheckCircle2 size={28} />
        <div>
          <span className="section-kicker">درخواست ثبت شد</span>
          <h3>درخواست شما خصوصی برای {businessName} ارسال شد.</h3>
          <p>کد پیگیری: <strong dir="ltr">{requestCode}</strong></p>
          <small><LockKeyhole size={13} /> اطلاعات درخواست و قیمت پیشنهادی روی صفحه عمومی نمایش داده نمی‌شوند.</small>
          <a
            className="pill-button dark quote-track-link"
            href={"/request-status?code=" + encodeURIComponent(requestCode)}
          >
            پیگیری پاسخ کسب‌وکار
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="quote-request-form glass-panel" onSubmit={submit} onFocusCapture={start}>
      <div className="quote-form-heading">
        <span className="quote-form-icon"><MessageCircle size={20} /></span>
        <div>
          <span className="section-kicker">استعلام خصوصی</span>
          <h3>از {businessName} قیمت بگیر</h3>
          <p>درخواست مستقیماً وارد پنل همین کسب‌وکار می‌شود.</p>
        </div>
      </div>

      <div className="quote-form-grid">
        {services.length > 0 && <label className="quote-wide"><span>خدمت موردنیاز</span><select value={service} onChange={e => setService(e.target.value)}><option value="">انتخاب خدمت (اختیاری)</option>{services.map(item => <option key={item} value={item}>{item}</option>)}</select></label>}
        <label>
          <span>نام شما</span>
          <input autoComplete="name" maxLength={120} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="مثلاً علی رضایی" />
        </label>
        <label>
          <span>شماره همراه</span>
          <input autoComplete="tel" type="tel" dir="ltr" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09..." />
        </label>
        <label>
          <span>محله یا محدوده</span>
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثلاً عظیمیه" />
        </label>
        <label className="quote-honeypot" aria-hidden="true">
          <span>وب‌سایت</span>
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        <label className="quote-wide">
          <span>چه کاری می‌خواهید انجام شود؟</span>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            rows={4}
            placeholder="نوع خدمت و متریال، ابعاد فضا، وضعیت زیرکار، نیاز به نصب و زمان موردنظر را بنویسید."
          />
        </label>
        <label>
          <span>حداقل بودجه اختیاری</span>
          <input dir="ltr" inputMode="numeric" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="تومان" />
        </label>
        <label>
          <span>حداکثر بودجه اختیاری</span>
          <input dir="ltr" inputMode="numeric" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="تومان" />
        </label>
      </div>

      <div className="quote-privacy-note">
        <LockKeyhole size={15} />
        <span>نام، شماره، متن درخواست و پیشنهاد قیمت خصوصی‌اند و در پروفایل عمومی منتشر نمی‌شوند.</span>
      </div>

      {message && <div className="quote-form-error" role="alert">{message}</div>}

      <button className="pill-button dark quote-submit" type="submit" disabled={loading}>
        {loading ? "در حال ارسال..." : "ارسال درخواست قیمت"} <Send size={15} />
      </button>
    </form>
  );
}
