"use client";

import { useRef, useState } from "react";
import { ArrowUpLeft, BadgeCheck, MapPin, Star, Store } from "lucide-react";

export type ShelfBusiness = { slug: string; name: string; city: string; area: string; category: string; categoryName: string; coverUrl: string; verified: boolean; rating: number; reviewCount: number };
const categories = [["", "همه غرفه‌ها"], ["curtain", "پرده"], ["flooring", "کفپوش و پارکت"], ["carpet", "موکت"], ["wallpaper", "کاغذ دیواری"], ["interior-design", "طراحی داخلی"], ["smart-home", "خانه هوشمند"]] as const;

export default function HomeBusinessShelf({ initialBusinesses }: { initialBusinesses: ShelfBusiness[] }) {
  const [items, setItems] = useState(initialBusinesses);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  async function selectCategory(value: string) {
    setCategory(value); setLoading(true); setError(false);
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/v1/businesses?limit=6&category=" + encodeURIComponent(value), { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data)) throw new Error("Unavailable");
      if (id === requestId.current) setItems(body.data);
    } catch { if (id === requestId.current) setError(true); }
    finally { if (id === requestId.current) setLoading(false); }
  }
  const categoryName = categories.find(([value]) => value === category)?.[1];
  return <section className="section market-shelf" id="shops" aria-labelledby="market-shelf-title">
    <div className="shell">
      <div className="market-section-heading"><div><span className="section-kicker">ویترین کسب‌وکارهای خونه‌نما</span><h2 id="market-shelf-title">غرفه‌ها را همین‌جا ببین.</h2><p>خرید اشتراک امتیاز مشتری نیست. ترتیب این فهرست از امتیازهای منتشرشده و تعداد نظرها تأثیر می‌گیرد؛ غرفه‌های جدید بدون نظر با امتیاز ساختگی نمایش داده نمی‌شوند.</p><p>نمونه‌کار، شهر و نظر مشتریان؛ اطلاعاتی که برای انتخاب نیاز داری.</p></div><a href={category ? "/category/" + category : "/search"}>مشاهده همه <ArrowUpLeft size={18} /></a></div>
      <div className="market-filter-row" aria-label="انتخاب صنف">{categories.map(([value, label]) => <button type="button" aria-pressed={category === value} key={value} onClick={() => void selectCategory(value)}>{label}</button>)}</div>
      <div aria-live="polite" aria-busy={loading}>
        {loading ? <div className="market-loading" role="status">در حال دریافت غرفه‌ها…</div> : error ? <div className="market-empty"><Store size={30} /><h3>دریافت غرفه‌ها انجام نشد.</h3><p>دوباره تلاش کن یا وارد جستجوی کسب‌وکارها شو.</p><button className="pill-button" type="button" onClick={() => void selectCategory(category)}>تلاش دوباره</button></div> : items.length ? <div className="market-business-grid">{items.map(b => <article className="market-business-card" key={b.slug}>
          <a className="market-business-photo" href={"/business/" + b.slug + "#gallery"} aria-label={"دیدن نمونه‌کارهای " + b.name}>{b.coverUrl ? <img src={b.coverUrl} alt={"تصویر غرفه " + b.name} width={600} height={400} loading="lazy" decoding="async" /> : <div className="market-photo-empty"><Store size={36} /><span>تصویر غرفه هنوز اضافه نشده</span></div>}<span>دیدن نمونه‌کارها <ArrowUpLeft size={16} /></span></a>
          <div className="market-business-copy"><small>{b.categoryName}</small><h3><a href={"/business/" + b.slug}>{b.name}</a>{b.verified && <BadgeCheck size={19} aria-label="کسب‌وکار تأییدشده" />}</h3><p><MapPin size={14} />{[b.city, b.area].filter(Boolean).join("، ") || "موقعیت ثبت نشده"}</p><a className="market-business-rating" href={"/business/" + b.slug + "#reviews"}><Star size={16} fill={b.reviewCount ? "currentColor" : "none"} />{b.reviewCount ? <><strong>{b.rating.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}</strong><span>از ۵ · {b.reviewCount.toLocaleString("fa-IR")} نظر</span></> : <span>هنوز نظری منتشر نشده</span>}</a><a className="market-business-open" href={"/business/" + b.slug}>ورود به غرفه <ArrowUpLeft size={17} /></a></div>
        </article>)}</div> : <div className="market-empty"><Store size={32} /><h3>{category ? "غرفه‌های «" + categoryName + "» اینجا نمایش داده می‌شوند." : "جای غرفه شما در این بازار آماده است."}</h3><p>با انتشار کسب‌وکارها، اطلاعات و تصاویر خودشان در این ویترین قرار می‌گیرد. اکنون غرفه‌ای برای نمایش در این بخش موجود نیست.</p><div><a className="pill-button dark" href="/register-business">ثبت رایگان کسب‌وکار <ArrowUpLeft size={17} /></a><a className="pill-button" href={category ? "/category/" + category : "/#categories"}>راهنمای انتخاب خدمات</a></div></div>}
      </div>
    </div>
  </section>;
}
