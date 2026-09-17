"use client";

import dynamic from "next/dynamic";
import { MapPin, Search, Sparkles } from "lucide-react";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <div className="hero-canvas hero-canvas-placeholder" aria-hidden="true" />,
});

const popular = [
  ["پرده", "/category/curtain"],
  ["موکت", "/category/carpet"],
  ["پارکت", "/category/flooring"],
  ["کاغذ دیواری", "/category/wallpaper"],
] as const;

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />

      <div className="shell hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} />
            مرجع دکوراسیون و خدمات منزل
          </div>

          <h1>
            خونه‌ات رو
            <span>همون‌طوری بساز</span>
            که دوست داری.
          </h1>

          <p>
            پرده، موکت، کفپوش، کاغذ دیواری و متخصصان دکوراسیون را پیدا کن،
            مقایسه کن و مستقیم با بهترین گزینه‌های اطرافت ارتباط بگیر.
          </p>

          <form className="hero-search" action="/search" method="get">
            <label>
              <Search size={20} />
              <span>
                <small>چی می‌خوای؟</small>
                <input name="q" aria-label="خدمت یا محصول" placeholder="مثلاً پرده زبرا" />
              </span>
            </label>

            <span className="search-separator" />

            <label>
              <MapPin size={20} />
              <span>
                <small>کجا؟</small>
                <input name="location" aria-label="شهر یا محله" defaultValue="کرج" />
              </span>
            </label>

            <button type="submit">جستجو</button>
          </form>

          <div className="quick-links" aria-label="جستجوهای محبوب">
            <span>پرمخاطب:</span>
            {popular.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </div>

          <div className="hero-trust-row">
            <div><strong>کرج</strong><span>شروع محلی</span></div>
            <div><strong>برغان</strong><span>نقطه شروع</span></div>
            <div><strong>رایگان</strong><span>برای جستجوی کاربران</span></div>
          </div>
        </div>

        <div className="hero-visual-wrap">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}
