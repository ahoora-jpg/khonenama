import { ArrowUpLeft, MapPin, Search, Sparkles, WandSparkles } from "lucide-react";
import HeroCoverflow from "./HeroCoverflow";

const popular = [
  ["پرده", "/search?q=پرده&location=کرج"],
  ["موکت", "/search?q=موکت&location=کرج"],
  ["پارکت", "/search?q=پارکت&location=کرج"],
  ["کاغذ دیواری", "/search?q=کاغذ+دیواری&location=کرج"],
] as const;

export default function Hero() {
  return (
    <section className="hero premium-hero hero-editorial-layout" id="top">
      <div className="shell hero-editorial-shell">
        <header className="hero-identity-block">
          <div className="eyebrow hero-brand-label">
            <Sparkles size={15} />
            خونه نما؛ انتخاب آگاهانه برای فضای داخلی خانه
          </div>

          <h1 className="hero-identity-title">
            خونه نما؛ مرجع دکوراسیون داخلی و فضای داخلی خانه
          </h1>
        </header>

        <div className="hero-showcase premium-visual-wrap">
          <HeroCoverflow />
        </div>

        <div className="hero-after-showcase">
          <div className="hero-after-copy">
            <h2 className="hero-slogan">برای خونه‌ات، بهتر انتخاب کن.</h2>
            <p className="hero-lead">
              خونه نما (Khonenama) برای پیدا کردن و مقایسه فروشگاه‌ها، متخصصان، متریال و ایده‌های
              دکوراسیون و فضای داخلی خانه ساخته شده؛ از پرده و کفپوش تا طراحی داخلی و خانه هوشمند.
            </p>
          </div>

          <div className="hero-discovery-panel">
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
      </div>
    </section>
  );
}
