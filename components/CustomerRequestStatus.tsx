"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, LockKeyhole, MessageCircle, Phone, Search } from "lucide-react";

type Result = {
  request: {
    code: string;
    customerName: string;
    requestText: string;
    city: string;
    area: string;
    budgetMin: number | null;
    budgetMax: number | null;
    status: string;
    createdAt: string;
  };
  businesses: {
    slug: string;
    name: string;
    phone: string;
    whatsapp: string;
    quote: null | {
      amount: number | null;
      message: string;
      status: string;
      updatedAt: string;
    };
  }[];
};

function money(value: number | null) {
  if (value == null) return "";
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

export default function CustomerRequestStatus({ initialCode = "" }: { initialCode?: string }) {
  const [requestCode, setRequestCode] = useState(initialCode);
  const [customerPhone, setCustomerPhone] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setResult(null);

    if (!requestCode.trim() || customerPhone.trim().length < 10) {
      setMessage("کد درخواست و شماره همراه همان درخواست را کامل وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/lead/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestCode, customerPhone }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setMessage(
          data?.error === "REQUEST_NOT_FOUND"
            ? "درخواستی با این کد و شماره همراه پیدا نشد."
            : "اطلاعات پیگیری معتبر نیست."
        );
        return;
      }

      setResult({ request: data.request, businesses: data.businesses || [] });
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="request-status-shell">
      <form className="request-status-form glass-panel" onSubmit={lookup}>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">پیگیری خصوصی</span>
            <h2>وضعیت درخواست قیمت</h2>
          </div>
          <LockKeyhole size={20} />
        </div>
        <p>برای مشاهده پاسخ، کد درخواست و همان شماره همراهی را وارد کنید که هنگام ثبت درخواست استفاده کرده‌اید.</p>
        <div className="request-status-fields">
          <label>
            <span>کد درخواست</span>
            <input dir="ltr" value={requestCode} onChange={(e) => setRequestCode(e.target.value)} placeholder="KH-000001" />
          </label>
          <label>
            <span>شماره همراه</span>
            <input dir="ltr" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09..." />
          </label>
        </div>
        {message && <div className="quote-form-error" role="alert">{message}</div>}
        <button className="pill-button dark" type="submit" disabled={loading}>
          <Search size={15} /> {loading ? "در حال بررسی..." : "پیگیری درخواست"}
        </button>
      </form>

      {result && (
        <section className="request-status-result glass-panel">
          <div className="request-status-head">
            <div>
              <span className="section-kicker">پرونده درخواست</span>
              <h2>{result.request.code}</h2>
            </div>
            <span className="request-status-private"><LockKeyhole size={13} /> فقط برای شما</span>
          </div>

          <p className="request-status-text">{result.request.requestText}</p>
          <div className="request-status-meta">
            <span>{[result.request.city, result.request.area].filter(Boolean).join("، ")}</span>
            {(result.request.budgetMin || result.request.budgetMax) && (
              <span>
                بودجه: {result.request.budgetMin ? money(result.request.budgetMin) : "—"} تا {result.request.budgetMax ? money(result.request.budgetMax) : "—"}
              </span>
            )}
          </div>

          <div className="customer-quote-list">
            {result.businesses.map((business) => (
              <article className="customer-quote-card" key={business.slug}>
                <div>
                  <h3>{business.name}</h3>
                  <a href={"/business/" + business.slug}>مشاهده پروفایل</a>
                </div>
                {business.quote ? (
                  <div className="customer-quote-value">
                    <CheckCircle2 size={18} />
                    <div>
                      <span>پیشنهاد ثبت‌شده</span>
                      {business.quote.amount != null && <strong>{money(business.quote.amount)}</strong>}
                      {business.quote.message && <p>{business.quote.message}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="customer-quote-waiting">
                    <Clock3 size={16} />
                    <span>هنوز پیشنهاد قیمتی ثبت نشده است.</span>
                  </div>
                )}
                <div className="customer-quote-contact">
                  {business.phone && <a href={"tel:" + business.phone}><Phone size={13} /> تماس</a>}
                  {business.whatsapp && (
                    <a
                      href={"https://wa.me/" + business.whatsapp.replace(/\D/g, "").replace(/^0/, "98")}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={13} /> واتساپ
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
