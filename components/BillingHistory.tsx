"use client";
import { useCallback, useEffect, useState } from "react";
import PaymentReceipt, { receiptEligible, type ReceiptInvoice } from "@/components/PaymentReceipt";
export default function BillingHistory() {
  const [rows, setRows] = useState<ReceiptInvoice[]>([]);
  const [message, setMessage] = useState("در حال بررسی سوابق پرداخت…");
  const [busy, setBusy] = useState("");
  const [selected, setSelected] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/billing/history", { cache: "no-store" });
      if (!r.ok) throw Error();
      const d = await r.json();
      setRows(d.invoices);
      setMessage(d.invoices.length ? "" : "هنوز فاکتوری ندارید.");
    } catch { setRows([]); setSelected(""); setMessage("دریافت سوابق انجام نشد؛ دوباره بررسی کنید."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function retry(id: string) {
    setBusy(id);
    try {
      const r = await fetch("/api/billing/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await r.json();
      if (!r.ok) throw Error();
      await load();
      setMessage(d.status === "paid" ? "پرداخت تأیید و اشتراک فعال شد؛ رسید را از همان فاکتور باز کنید." : d.status === "failed" ? "درگاه پرداخت را تأیید نکرد." : "تأیید هنوز کامل نشده؛ دوباره پرداخت نکنید و کمی بعد بررسی کنید.");
    } catch { setMessage("بررسی انجام نشد؛ دوباره پرداخت نکنید و بعداً بررسی کنید یا با پشتیبانی تماس بگیرید."); }
    finally { setBusy(""); }
  }
  return <div className="billing-history"><p role="status" aria-live="polite">{message}</p>{rows.map(row => <article className="dashboard-panel" key={row.id}>
    <h3>{row.plan_code === "premium" ? "ویژه" : "حرفه‌ای"} · {row.duration_days.toLocaleString("fa-IR")} روز</h3>
    <p>{row.total_amount.toLocaleString("fa-IR")} تومان · {row.status === "paid" ? "پرداخت موفق؛ اشتراک فعال شده" : row.status === "failed" ? "ناموفق" : row.payment_status === "verified" ? "پرداخت تأیید شده؛ فعال‌سازی در انتظار بررسی" : "در انتظار تأیید"}</p>
    <small>فاکتور: <bdi>{row.invoice_number}</bdi></small>
    {row.provider_reference && <p>شماره پیگیری: <bdi>{row.provider_reference}</bdi></p>}
    {receiptEligible(row) && <><button type="button" className="pill-button" aria-expanded={selected === row.id} onClick={() => setSelected(selected === row.id ? "" : row.id)}>{selected === row.id ? "بستن رسید" : "مشاهده رسید و بلیت اشتراک"}</button>{selected === row.id && <PaymentReceipt invoice={row} />}</>}
    {row.status === "pending" && <button className="pill-button" type="button" disabled={!!busy} onClick={() => void retry(row.id)}>{busy === row.id ? "در حال بررسی…" : "بررسی دوباره نتیجه پرداخت"}</button>}
  </article>)}<button type="button" disabled={!!busy} onClick={() => void load()}>تازه‌کردن سوابق</button></div>;
}
