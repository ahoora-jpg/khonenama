"use client";

import { useEffect, useState } from "react";

type Row = Record<string, string | number>;

export default function AdminSeoJourney() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState("در حال دریافت داده…");

  async function load() {
    setMessage("در حال دریافت داده…");
    try {
      const response = await fetch("/api/admin/seo-journey", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error();
      setData(payload);
      setMessage("");
    } catch {
      setMessage("دریافت گزارش SEO انجام نشد.");
    }
  }

  useEffect(() => { void load(); }, []);

  function table(rows: Row[], columns: [string, string][]) {
    if (!rows?.length) return <p>هنوز داده‌ای ثبت نشده است.</p>;
    return (
      <div className="admin-table-scroll">
        <table>
          <thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map(([key]) => <td key={key}>{typeof row[key] === "number" ? Number(row[key]).toLocaleString("fa-IR") : String(row[key] ?? "—")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="marketplace-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">۳۰ روز اخیر</span>
          <h1>مسیر SEO / AI تا اقدام کاربر</h1>
          <p>داده‌ها تجمیعی‌اند و شناسه شخصی، IP یا URL خارجی خام ذخیره نمی‌شود.</p>
        </div>
        <button className="pill-button" type="button" onClick={load}>بروزرسانی</button>
      </div>
      {message && <p role="status">{message}</p>}
      {data && <>
        <article className="dashboard-panel glass-panel">
          <h2>کیفیت موجودی واقعی بازار</h2>
          <div className="analytics-mini-grid">
            <div><strong>{Number(data.inventory?.published || 0).toLocaleString("fa-IR")}</strong><span>غرفه منتشرشده</span></div>
            <div><strong>{Number(data.inventory?.withPhoto || 0).toLocaleString("fa-IR")}</strong><span>حداقل یک عکس</span></div>
            <div><strong>{Number(data.inventory?.withThreePhotos || 0).toLocaleString("fa-IR")}</strong><span>حداقل ۳ عکس</span></div>
            <div><strong>{Number(data.inventory?.withReviews || 0).toLocaleString("fa-IR")}</strong><span>دارای نظر واقعی</span></div>
            <div><strong>{Number(data.inventory?.withUsefulDescription || 0).toLocaleString("fa-IR")}</strong><span>معرفی ۸۰+ نویسه</span></div>
            <div><strong>{Number(data.inventory?.overlyBroadServices || 0).toLocaleString("fa-IR")}</strong><span>خدمات بیش‌ازحد گسترده</span></div>
          </div>
          <h3>توزیع شهرها</h3>
          {table(data.cities || [], [["city","شهر"],["total","غرفه"]])}
          <h3>غرفه‌های نیازمند تکمیل</h3>
          {table(data.needsAttention || [], [
            ["name","غرفه"],["city","شهر"],["photo_count","عکس"],
            ["review_count","نظر"],["description_length","طول معرفی"],["service_count","خدمت"]
          ])}
          <h3>تراکم واقعی شهر × دسته</h3>
          <p>این جدول مبنای تصمیم برای ساخت یا تقویت لندینگ‌های محلی است؛ صفحه شهری بدون موجودی واقعی ساخته نشود.</p>
          {table(data.localDensity || [], [["city","شهر"],["category","دسته"],["total","غرفه"]])}
        </article>
        <article className="dashboard-panel glass-panel">
          <h2>منبع ورود صفحه‌ها</h2>
          {table(data.sources, [["source","منبع"],["total","بازدید"]])}
        </article>
        <article className="dashboard-panel glass-panel">
          <h2>رویدادهای مسیر</h2>
          {table(data.events, [["event","رویداد"],["total","تعداد"]])}
        </article>
        <article className="dashboard-panel glass-panel">
          <h2>مقصد کلیک‌های داخلی</h2>
          {table(data.targets, [["target_group","مقصد"],["total","تعداد"]])}
        </article>
        <article className="dashboard-panel glass-panel">
          <h2>صفحه‌های ورودی بر اساس منبع</h2>
          {table(data.pages, [["path","صفحه"],["source","منبع"],["total","بازدید"]])}
        </article>
      </>}
    </section>
  );
}
