"use client";

import { ArrowUpLeft, Bookmark, BookmarkCheck, Images, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { readIdeaBoard, type SavedIdea, writeIdeaBoard } from "@/components/idea-board";

const items = [
  {
    title: "کرکره پنجره و نور طبیعی",
    category: "پرده و پارچه",
    href: "/category/curtain",
    img: "/images/home-v1/photo-1602612996819-3cd306f68b4e.webp",
  },
  {
    title: "چوب و کفپوش گرم",
    category: "پارکت و لمینت",
    href: "/category/flooring",
    img: "/images/home-v1/photo-1600573472550-8090b5e0745e.webp",
  },
  {
    title: "دیوار شاخص و بافت",
    category: "کاغذ دیواری",
    href: "/category/wallpaper",
    img: "/images/home-v1/photo-1615874694520-474822394e73.webp",
  },
  {
    title: "خانه‌ای با نور و بافت",
    category: "طراحی داخلی",
    href: "/category/interior-design",
    img: "/images/home-v1/photo-1616486338812-3dadae4b4ace.webp",
  },
];

export default function InspirationGallery() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readIdeaBoard().map((item) => item.id));
  }, []);

  function toggleSaved(item: typeof items[number]) {
    const current = readIdeaBoard();
    const exists = current.some((saved) => saved.id === item.href);
    const next: SavedIdea[] = exists
      ? current.filter((saved) => saved.id !== item.href)
      : [{ id: item.href, title: item.title, category: item.category, href: item.href, img: item.img }, ...current];
    writeIdeaBoard(next);
    setSavedIds(next.map((saved) => saved.id));
  }

  return (
    <section id="ideas" className="section inspiration-showcase" aria-labelledby="inspiration-title">
      <div className="shell">
        <div className="section-heading premium-heading inspiration-heading">
          <div>
            <span className="section-kicker"><Sparkles size={14} /> ایده و نمونه تصویری</span>
            <h2 id="inspiration-title">قبل از انتخاب، فضا و اجرای خوب را ببین.</h2>
            <p>چند تصویر منتخب برای مقایسه سبک، نور، بافت و متریال؛ تصاویر بیشتر داخل راهنماهای تخصصی قرار می‌گیرند.</p>
          </div>
          <div className="inspiration-heading-links"><a className="text-link-arrow" href="/my-ideas">ایده‌های من <Bookmark size={16} /></a><a className="text-link-arrow" href="/magazine">راهنماهای دکوراسیون <ArrowUpLeft size={16} /></a></div>
        </div>

        <div className="inspiration-masonry">
          {items.map((item, index) => (
            <article className={"inspiration-tile inspiration-tile-" + ((index % 4) + 1)} key={item.title}>
              <a href={item.href} aria-label={item.title}>
                <img src={item.img} alt={item.title} width={1200} height={675} loading="lazy" decoding="async" />
                <span className="inspiration-scrim" aria-hidden="true" />
                <span className="inspiration-overlay"><small>{item.category}</small><strong>{item.title}</strong><span><Images size={14} /> مشاهده ایده</span></span>
              </a>
              <button className="idea-save-button" type="button" aria-pressed={savedIds.includes(item.href)} onClick={() => toggleSaved(item)}>
                {savedIds.includes(item.href) ? <><BookmarkCheck size={17} /> ذخیره شد</> : <><Bookmark size={17} /> ذخیره ایده</>}
              </button>
            </article>
          ))}
        </div>

        <p className="inspiration-disclaimer">
          تصاویر این بخش برای الهام و نمایش ساختار خونه نما هستند و نمونه‌کار کسب‌وکار واقعی محسوب نمی‌شوند؛
          نمونه‌کار واقعی فقط توسط صاحب همان کسب‌وکار در پروفایلش منتشر می‌شود.
        </p>
      </div>
    </section>
  );
}
