"use client";

import { useEffect, useState } from "react";

type Suggestion = { id: number; proposed_name: string; relationship_type: string; status: string; business_name: string; business_slug: string; created_at: string };

export default function AdminBrandSuggestions() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [names, setNames] = useState<Record<number, string>>({});

  async function load() {
    try {
      const response = await fetch("/api/admin/brand-suggestions", { cache: "no-store" });
      if (response.status === 401) { window.location.href = "/admin/login"; return; }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error("LOAD_FAILED");
      setItems(data.suggestions || []);
    } catch { setMessage("دریافت پیشنهادهای برند انجام نشد."); }
  }

  useEffect(() => { void load(); }, []);

  async function decide(item: Suggestion, action: "approve" | "reject") {
    setBusy(item.id); setMessage("");
    try {
      const response = await fetch("/api/admin/brand-suggestions", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action, name: names[item.id] || item.proposed_name }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error("SAVE_FAILED");
      setMessage(action === "approve" ? "برند برای استفاده در ثبت غرفه تأیید شد؛ هنوز صفحه یا لوگوی عمومی ندارد." : "پیشنهاد رد شد.");
      await load();
    } catch { setMessage("ثبت تصمیم انجام نشد."); } finally { setBusy(null); }
  }

  return <section className="dashboard-panel glass-panel">
    <h2>پیشنهادهای برند غرفه‌داران</h2>
    <p>تأیید اینجا فقط برند را به فهرست داخلی ثبت غرفه اضافه می‌کند. تا وقتی صفحه، متن و مجوز دارایی تصویری جداگانه تأیید نشود، هیچ برند یا ادعای «نمایندگی رسمی» عمومی نمی‌شود.</p>
    <button type="button" onClick={() => void load()}>تازه‌سازی</button>
    {message && <p role="status">{message}</p>}
    {!items.length && <p>پیشنهاد جدیدی برای بررسی نیست.</p>}
    {items.map((item) => <article key={item.id} className="category-seo-copy-card">
      <h3>{item.proposed_name}</h3>
      <p><a href={`/business/${item.business_slug}`} target="_blank" rel="noreferrer">{item.business_name}</a> · {item.relationship_type === "installer" ? "مجری / نصاب" : item.relationship_type === "representative" ? "ادعای نمایندگی؛ نیازمند مدرک" : "فروشنده"} · {item.status === "pending" ? "در انتظار بررسی" : item.status === "approved" ? "تأییدشده برای فهرست داخلی" : "ردشده"}</p>
      {item.status === "pending" && <>
        <label>نام اصلاح‌شده<input maxLength={80} value={names[item.id] ?? item.proposed_name} onChange={(event) => setNames({ ...names, [item.id]: event.target.value })} /></label>
        <button type="button" disabled={busy === item.id} onClick={() => void decide(item, "approve")}>تأیید برای فهرست داخلی</button>
        <button type="button" disabled={busy === item.id} onClick={() => void decide(item, "reject")}>رد پیشنهاد</button>
      </>}
    </article>)}
  </section>;
}
