"use client";
import { useCallback, useEffect, useState } from "react";
type Invoice = { id: string; invoice_number: string; plan_code: string; duration_days: number; total_amount: number; status: string; payment_status: string; provider_reference: string | null; activation_ends_at: string | null };
export default function BillingHistory() {
  const [rows, setRows] = useState<Invoice[]>([]), [message, setMessage] = useState("در حال دریافت سوابق…"), [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try { const r = await fetch("/api/billing/history", { cache: "no-store" }); if (!r.ok) throw Error(); const d = await r.json(); setRows(d.invoices); setMessage(d.invoices.length ? "" : "هنوز فاکتوری ندارید."); }
    catch { setMessage("دریافت سوابق انجام نشد؛ دوباره بررسی کنید."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function retry(id: string) {
    setBusy(id);
    try { const r = await fetch("/api/billing/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); const d = await r.json(); if (!r.ok) throw Error(); await load(); setMessage(d.status === "paid" ? "پرداخت تأیید و اشتراک فعال شد؛ برای مشاهده امکانات، داشبورد را باز کنید." : d.status === "failed" ? "درگاه پرداخت را تأیید نکرد." : "تأیید هنوز کامل نشده؛ دوباره پرداخت نکنید و کمی بعد بررسی کنید."); }
    catch { setMessage("بررسی انجام نشد؛ دوباره پرداخت نکنید و بعداً بررسی کنید یا با پشتیبانی تماس بگیرید."); }
    finally { setBusy(""); }
  }
  return <div><p role="status">{message}</p>{rows.map(row => <article className="dashboard-panel" key={row.id}><h3>{row.plan_code === "premium" ? "ویژه" : "حرفه‌ای"} · {row.duration_days.toLocaleString("fa-IR")} روز</h3><p>{row.total_amount.toLocaleString("fa-IR")} تومان · {row.status === "paid" ? "پرداخت موفق؛ اشتراک فعال شده" : row.status === "failed" ? "ناموفق" : row.payment_status === "verified" ? "پرداخت تأیید شده؛ فعال‌سازی در انتظار بررسی" : "در انتظار تأیید"}</p><small>فاکتور: <bdi>{row.invoice_number}</bdi></small>{row.provider_reference && <p>شماره پیگیری: <bdi>{row.provider_reference}</bdi></p>}{row.activation_ends_at && <p>اعتبار این خرید تا: {new Date(row.activation_ends_at.replace(" ", "T") + "Z").toLocaleDateString("fa-IR")}</p>}{row.status === "pending" && <button className="pill-button" type="button" disabled={!!busy} onClick={() => void retry(row.id)}>{busy === row.id ? "در حال بررسی…" : "بررسی دوباره نتیجه پرداخت"}</button>}</article>)}<button type="button" disabled={!!busy} onClick={() => void load()}>تازه‌کردن سوابق</button></div>;
}
