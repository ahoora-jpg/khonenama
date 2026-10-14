"use client";
import { useEffect, useState } from "react";

export type ReceiptInvoice = {
  id: string; invoice_number: string; plan_code: string; duration_days: number;
  total_amount: number; status: string; payment_status: string;
  provider_reference: string | null; activation_ends_at: string | null;
  verified_at?: string | null;
};
export function receiptEligible(row: ReceiptInvoice) {
  return row.payment_status === "verified" && !!row.provider_reference && !!row.verified_at;
}
function dateLabel(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? "تاریخ قابل نمایش نیست" : date.toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
}
export default function PaymentReceipt({ invoice }: { invoice: ReceiptInvoice }) {
  const eligible = receiptEligible(invoice);
  const [stage, setStage] = useState<"printing" | "complete">("printing");
  useEffect(() => {
    setStage("printing");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage("complete"); return; }
    const timer = window.setTimeout(() => setStage("complete"), 1500);
    return () => window.clearTimeout(timer);
  }, [invoice.id]);
  if (!eligible) return null;
  const plan = invoice.plan_code === "premium" ? "ویژه" : "حرفه‌ای";
  return <section className="payment-receipt" dir="rtl" aria-label="رسید پرداخت خونه‌نما" data-stage={stage}>
    <div className="receipt-machine"><strong>خونه‌نما</strong><p role="status" aria-live="polite">{stage === "printing" ? "چاپ رسید…" : "پرداخت موفق"}</p><span className="receipt-slot" aria-hidden="true" /></div>
    <div className="receipt-feed"><article className="receipt-paper">
      <h3>رسید پرداخت خونه‌نما</h3><p>اشتراک {plan}</p>
      <dl><div><dt>مبلغ پرداخت‌شده</dt><dd>{invoice.total_amount.toLocaleString("fa-IR")} تومان</dd></div>
        <div><dt>مدت اشتراک</dt><dd>{invoice.duration_days.toLocaleString("fa-IR")} روز</dd></div>
        <div><dt>تاریخ پرداخت</dt><dd>{dateLabel(invoice.verified_at!)}</dd></div>
        <div><dt>شماره فاکتور</dt><dd><bdi>{invoice.invoice_number}</bdi></dd></div>
        <div><dt>شماره پیگیری</dt><dd><bdi>{invoice.provider_reference}</bdi></dd></div></dl>
      <p>{invoice.status === "paid" ? "پرداخت تأیید و اشتراک فعال شده است." : "پرداخت تأیید شده؛ فعال‌سازی اشتراک در انتظار بررسی است."}</p>
    </article></div>
    <div className="subscription-ticket"><span>بلیت اشتراک خونه‌نما</span><strong>{plan} · {invoice.duration_days.toLocaleString("fa-IR")} روز</strong><p>{invoice.activation_ends_at ? `اعتبار این خرید تا ${dateLabel(invoice.activation_ends_at)}` : "در انتظار فعال‌سازی"}</p><small>این کارت نشان تأیید کسب‌وکار نیست.</small></div>
    <button type="button" className="pill-button receipt-print" onClick={() => window.print()}>چاپ یا ذخیره PDF رسید</button>
  </section>;
}
