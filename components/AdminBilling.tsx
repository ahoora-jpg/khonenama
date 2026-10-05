"use client";
import { useEffect, useState } from "react";
type Price = { plan_code: string; amount_toman: number | null; duration_days: number; enabled: number };
export default function AdminBilling() {
  const [rows, setRows] = useState<Price[]>([]), [ready, setReady] = useState(false), [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/admin/billing", { cache: "no-store" }).then(async r => { if (r.status === 401) { location.href = "/admin/login"; return; } if (!r.ok) throw Error(); const d = await r.json(); setRows(d.prices); setReady(d.gatewayReady); }).catch(() => setMessage("دریافت تنظیمات انجام نشد.")); }, []);
  async function save(row: Price) {
    setMessage("در حال ذخیره…");
    const r = await fetch("/api/admin/billing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planCode: row.plan_code, amountToman: row.amount_toman, durationDays: row.duration_days, enabled: !!row.enabled }) }).catch(() => null);
    setMessage(r?.ok ? "قیمت ذخیره شد؛ فاکتورهای قبلی تغییر نمی‌کنند." : "ذخیره انجام نشد؛ مبلغ و مدت را بررسی کنید.");
  }
  function edit(code: string, update: Partial<Price>) { setRows(old => old.map(row => row.plan_code === code ? { ...row, ...update } : row)); }
  return <section className="dashboard-panel glass-panel" dir="rtl"><h2>قیمت و مدت اشتراک</h2><p>{ready ? "درگاه آماده اتصال به خرید است." : "درگاه هنوز متصل نیست؛ ثبت قیمت به‌تنهایی پرداخت را فعال نمی‌کند."}</p><p>مبالغ به تومان و مبلغ نهایی قابل پرداخت هستند. تمدید همان اشتراک، اعتبار باقی‌مانده را حفظ می‌کند. تغییر به اشتراک بالاتر از زمان پرداخت شروع می‌شود.</p>{rows.map(row => <div className="dashboard-panel" key={row.plan_code}><h3>{row.plan_code === "pro" ? "حرفه‌ای" : "ویژه"}</h3><label>مبلغ نهایی، تومان <input type="number" min={1000} max={100000000} value={row.amount_toman ?? ""} onChange={e => edit(row.plan_code, { amount_toman: e.target.value ? Number(e.target.value) : null })} /></label><label> مدت، روز <input type="number" min={1} max={366} value={row.duration_days} onChange={e => edit(row.plan_code, { duration_days: Number(e.target.value) })} /></label><label><input type="checkbox" checked={!!row.enabled} onChange={e => edit(row.plan_code, { enabled: Number(e.target.checked) })} /> قیمت قطعی و قابل عرضه است</label><button className="pill-button" type="button" onClick={() => void save(row)}>ذخیره</button></div>)}<p role="status">{message}</p></section>;
}
