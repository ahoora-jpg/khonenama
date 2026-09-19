"use client";

import { ArrowUpLeft, MapPin, Search, Sparkles, WandSparkles } from "lucide-react";
import { CoverFlowCarousel } from "@/components/ui/3-d-coverflow-carousel";

const popular = [
  ["پرده", "/category/curtain"],
  ["موکت", "/category/carpet"],
  ["پارکت", "/category/flooring"],
  ["کاغذ دیواری", "/category/wallpaper"],
] as const;

export default function Hero() {
  return (
    <section className="hero premium-hero" id="top">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="hero-grid-lines" aria-hidden="true" />

      <div className="shell hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} />
            کشف بهترین‌های دکوراسیون، نزدیک تو
          </div>

          <h1>
            برای خونه‌ات
            <span>بهتر انتخاب کن.</span>
            قشنگ‌تر زندگی کن.
          </h1>

          <p className="hero-lead">
            خونه‌نما یک ویترین هوشمند برای پیدا کردن فروشگاه‌ها، متخصصان و ایده‌های دکوراسیون است؛
            با شروع از کرج و خیابان برغان.
          </p>

          <form className="hero-search premium-search" action="/search" method="get">
            <label>
              <Search size={20} />
              <span>
                <small>دنبال چی هستی؟</small>
                <input name="q" aria-label="خدمت یا محصول" placeholder="مثلاً پرده زبرا، پارکت یا طراح داخلی" />
              </span>
            </label>

            <span className="search-separator" />

            <label>
              <MapPin size={20} />
              <span>
                <small>کجایی؟</small>
                <input name="location" aria-label="شهر یا محله" defaultValue="کرج" />
              </span>
            </label>

            <button type="submit">جستجو <ArrowUpLeft size={17} /></button>
          </form>

          <div className="quick-links" aria-label="جستجوهای محبوب">
            <span>پرمخاطب:</span>
            {popular.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </div>

          <div className="hero-trust-row premium-trust-row">
            <div><strong>۵ دسته اصلی</strong><span>برای شروع انتخاب</span></div>
            <div><strong>شروع از برغان</strong><span>تمرکز محلی و واقعی</span></div>
            <div><strong>پروفایل حرفه‌ای</strong><span>برای کسب‌وکارها</span></div>
          </div>

          <a href="/#categories" className="hero-scroll-hint">
            <WandSparkles size={16} /> دیدن دسته‌بندی‌ها
          </a>
        </div>

        <div className="hero-visual-wrap premium-visual-wrap">
          <div className="hero-visual-frame hero-coverflow-frame">
            <CoverFlowCarousel compact className="hero-coverflow" />
          </div>
        </div>
      </div>
    </section>
  );
}
