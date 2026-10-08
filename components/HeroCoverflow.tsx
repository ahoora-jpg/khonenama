"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpLeft } from "lucide-react";

const slides = [
  {
    image: "/images/editorial/photo-1602612996819-3cd306f68b4e.webp",
    alt: "پرده و کرکره مدرن در فضای داخلی روشن",
    eyebrow: "پرده و پوشش پنجره",
    title: "نور را دقیق‌تر مدیریت کن",
    description: "مدل‌ها، فروشگاه‌ها و راهنماهای انتخاب پرده را یکجا ببین.",
    href: "/category/curtain",
  },
  {
    image: "/images/editorial/photo-1581688127942-81aa836de621.webp",
    alt: "کفپوش چوبی روشن در فضای داخلی کنار پنجره",
    eyebrow: "کفپوش و پارکت",
    title: "گرمای چوب زیر پای خانه",
    description: "پارکت، لمینت و اجرای تخصصی را آگاهانه مقایسه کن.",
    href: "/category/flooring",
  },
  {
    image: "/images/editorial/photo-1742799431910-985c27143e98.webp",
    alt: "کاغذ دیواری طرح‌دار در فضای داخلی",
    eyebrow: "دیوار و بافت",
    title: "دیوارها را وارد طراحی کن",
    description: "طرح، رنگ و اجرای کاغذ دیواری را قبل از انتخاب بررسی کن.",
    href: "/category/wallpaper",
  },
  {
    image: "/images/editorial/photo-1560185127-6ed189bf02f4.webp",
    alt: "چیدمان و طراحی داخلی نشیمن مدرن با نور طبیعی",
    eyebrow: "طراحی داخلی",
    title: "از ایده تا یک فضای هماهنگ",
    description: "طراحان، مجریان و نمونه‌های الهام‌بخش فضای داخلی را پیدا کن.",
    href: "/category/interior-design",
  },
  {
    image: "/images/editorial/photo-1600607687920-4e2a09cf159d.webp",
    alt: "فضای داخلی هوشمند با نورپردازی و پرده برقی",
    eyebrow: "خانه هوشمند",
    title: "راحتی را برای خانه برنامه‌ریزی کن",
    description: "پرده برقی، روشنایی و سناریوهای هوشمند را بهتر بشناس.",
    href: "/category/smart-home",
  },
  {
    image: "/images/editorial/photo-1661820030641-35d02e9e9b37.webp",
    alt: "پوشش کف و فرش در نشیمن روشن",
    eyebrow: "موکت و پوشش کف",
    title: "نرمی و آرامش زیر پا",
    description: "فروشگاه‌ها و خدمات موکت را در بازار تخصصی ببین.",
    href: "/category/carpet",
  },
  {
    image: "/images/editorial/photo-1518002903142-1f4ef6851390.webp",
    alt: "کرکره سفید کنار پنجره و گیاه سبز",
    eyebrow: "پرده و کرکره",
    title: "قاب تازه‌ای برای نور خانه",
    description: "برای انتخاب پوشش پنجره، خدمات و فروشگاه‌ها را مقایسه کن.",
    href: "/category/curtain",
  },
  {
    image: "/images/editorial/photo-1624900044729-fe57757bbaaa.webp",
    alt: "کف چوبی در کنار دیوار روشن",
    eyebrow: "پارکت و لمینت",
    title: "شروع طراحی از کف خانه",
    description: "گزینه‌های پوشش کف و مجریان مرتبط را پیدا کن.",
    href: "/category/flooring",
  },
  {
    image: "/images/editorial/photo-1780672824152-e671d2470d78.webp",
    alt: "کاغذ دیواری راه‌راه در فضای داخلی",
    eyebrow: "کاغذ دیواری",
    title: "طرحی که به خانه شخصیت می‌دهد",
    description: "طرح‌ها و خدمات اجرای دیوارپوش را بررسی کن.",
    href: "/category/wallpaper",
  },
] as const;

export default function HeroCoverflow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(0);

  const next = useCallback(() => setActive((current) => (current + 1) % slides.length), []);
  const previous = useCallback(() => setActive((current) => (current - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(next, 4600);
    return () => window.clearInterval(timer);
  }, [next, paused]);

  return (
    <section
      className="kh-coverflow"
      aria-label="دسته‌بندی‌های منتخب دکوراسیون خانه"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? 0; }}
      onTouchEnd={(event) => {
        const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
        if (Math.abs(distance) > 45) distance < 0 ? next() : previous();
      }}
    >
      <div
        className="kh-coverflow-backdrop"
        style={{ backgroundImage: `url(${slides[active].image})` }}
        aria-hidden="true"
      />
      <div className="kh-coverflow-shade" aria-hidden="true" />

      <div className="kh-coverflow-stage">
        {slides.map((slide, index) => {
          const offset = (index - active + slides.length) % slides.length;
          const position = offset === 0 ? "center" : offset === 1 ? "next" : offset === 2 ? "far-next" : offset === slides.length - 1 ? "previous" : offset === slides.length - 2 ? "far-previous" : "hidden";
          const isActive = index === active;

          return (
            <article
              className={`kh-coverflow-card is-${position}`}
              key={slide.image}
              aria-hidden={!isActive}
              onClick={() => !isActive && setActive(index)}
            >
              <img
                src={slide.image}
                alt={isActive ? slide.alt : ""}
                width={1200}
                height={675}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding="async"
                draggable={false}
              />
              <span className="kh-coverflow-card-shade" aria-hidden="true" />
              <div className="kh-coverflow-content">
                <span>{slide.eyebrow}</span>
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
                <a href={slide.href} tabIndex={isActive ? 0 : -1}>
                  مشاهده دسته‌بندی <ArrowUpLeft size={16} />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <button className="kh-coverflow-arrow kh-coverflow-previous" type="button" onClick={previous} aria-label="اسلاید قبلی">
        <ArrowRight size={20} />
      </button>
      <button className="kh-coverflow-arrow kh-coverflow-next" type="button" onClick={next} aria-label="اسلاید بعدی">
        <ArrowLeft size={20} />
      </button>

      <div className="kh-coverflow-dots" aria-label="انتخاب اسلاید">
        {slides.map((slide, index) => (
          <button
            type="button"
            className={index === active ? "is-active" : ""}
            onClick={() => setActive(index)}
            aria-label={`نمایش ${slide.eyebrow}`}
            aria-current={index === active ? "true" : undefined}
            key={slide.image}
          />
        ))}
      </div>
    </section>
  );
}
