"use client";

import { ArrowUpLeft, Images, Sparkles } from "lucide-react";

const fallbackImage =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=82";

const items = [
  {
    title: "پرده مدرن و نور طبیعی",
    category: "پرده و پارچه",
    href: "/category/curtain",
    img: "https://images.unsplash.com/photo-1598242822528-182185460969?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "چوب و کفپوش گرم",
    category: "پارکت و لمینت",
    href: "/category/flooring",
    img: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "بافت نرم برای نشیمن",
    category: "موکت و کف",
    href: "/category/carpet",
    img: "https://images.unsplash.com/photo-1628745750110-c8ddcdad2c15?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "دیوار شاخص و بافت",
    category: "کاغذ دیواری",
    href: "/category/wallpaper",
    img: "https://images.unsplash.com/photo-1742799431910-985c27143e98?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "نشیمن گرم و مینیمال",
    category: "طراحی داخلی",
    href: "/category/interior-design",
    img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "نورپردازی یکپارچه",
    category: "خانه هوشمند",
    href: "/category/smart-home",
    img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "چیدمان روشن و معاصر",
    category: "ایده دکوراسیون",
    href: "/magazine",
    img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "متریال طبیعی و آرام",
    category: "طراحی داخلی",
    href: "/category/interior-design",
    img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "فضای روشن و مینیمال",
    category: "الهام خونه‌نما",
    href: "/magazine",
    img: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84",
  },
  {
    title: "خانه‌ای با نور و بافت",
    category: "ایده و اجرا",
    href: "/search",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84",
  },
];

export default function InspirationGallery() {
  return (
    <section className="section inspiration-showcase" aria-labelledby="inspiration-title">
      <div className="shell">
        <div className="section-heading premium-heading inspiration-heading">
          <div>
            <span className="section-kicker"><Sparkles size={14} /> ایده و نمونه‌کار</span>
            <h2 id="inspiration-title">قبل از انتخاب، فضا و اجرای خوب را ببین.</h2>
            <p>ترکیب‌های واقعی‌نما از پرده، کف، دیوار، نور و چیدمان برای اینکه انتخاب فقط متنی نباشد.</p>
          </div>
          <a className="text-link-arrow" href="/magazine">
            راهنماهای دکوراسیون <ArrowUpLeft size={16} />
          </a>
        </div>

        <div className="inspiration-masonry">
          {items.map((item, index) => (
            <a
              className={"inspiration-tile inspiration-tile-" + ((index % 6) + 1)}
              href={item.href}
              key={item.title}
              aria-label={item.title}
            >
              <img
                src={item.img}
                alt={item.title}
                loading={index > 5 ? "lazy" : "eager"}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
              <span className="inspiration-scrim" aria-hidden="true" />
              <span className="inspiration-overlay">
                <small>{item.category}</small>
                <strong>{item.title}</strong>
                <span><Images size={14} /> مشاهده ایده</span>
              </span>
            </a>
          ))}
        </div>

        <p className="inspiration-disclaimer">
          تصاویر این بخش برای الهام و نمایش ساختار خونه‌نما هستند و نمونه‌کار کسب‌وکار واقعی محسوب نمی‌شوند؛
          نمونه‌کار واقعی فقط توسط صاحب همان کسب‌وکار در پروفایلش منتشر می‌شود.
        </p>
      </div>
    </section>
  );
}
