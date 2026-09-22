"use client";

import { ArrowUpLeft, MapPin, Search, Sparkles, WandSparkles } from "lucide-react";
import { CoverFlowCarousel } from "@/components/ui/3-d-coverflow-carousel";

const popular = [
  ["پرده", "/search?q=پرده&location=کرج"],
  ["موکت", "/search?q=موکت&location=کرج"],
  ["پارکت", "/search?q=پارکت&location=کرج"],
  ["کاغذ دیواری", "/search?q=کاغذ+دیواری&location=کرج"],
] as const;

export default function Hero() {
  return (
    <section className="hero premium-hero" id="top">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="hero-grid-lines" aria-hidden="true" />

      <div className="shell hero-grid">
        <div className="hero-copy">
          <div className="eyebrow hero-brand-label">
            <Sparkles size={15} />
            خونه‌نما؛ انتخاب آگاهانه برای خانه
          </div>

          <h1 className="hero-identity-title">
            مرجع تخصصی دکوراسیون و تزئینات داخلی منزل
          </h1>

          <h2 className="hero-slogan">
            برای خونه‌ات، بهتر انتخاب کن.
          </h2>

          <p className="hero-lead">
            فروشگاه‌ها، متخصصان، محصولات و ایده‌های دکوراسیون را پیدا کن، مقایسه کن
            و مستقیم با بهترین گزینه‌های اطرافت ارتباط بگیر.
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
            <div><strong>دسته‌بندی تخصصی</strong><span>محصول و خدمات خانه</span></div>
            <div><strong>جستجوی محلی</strong><span>شروع از کرج و برغان</span></div>
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
