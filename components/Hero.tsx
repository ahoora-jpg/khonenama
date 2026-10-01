import { ArrowUpLeft, MapPin, Search, Sparkles, WandSparkles } from "lucide-react";
import HeroCoverflow from "./HeroCoverflow";

const popular = [
  ["پرده", "/search?q=پرده"],
  ["موکت", "/search?q=موکت"],
  ["پارکت", "/search?q=پارکت"],
  ["کاغذ دیواری", "/search?q=کاغذ+دیواری"],
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
            فروشگاه و متخصص دکوراسیون داخلی را پیدا کن
          </h1>
        </header>

        <div className="hero-after-showcase">
          <div className="hero-after-copy">
            <h2 className="hero-slogan">برای خونه‌ات، بهتر انتخاب کن.</h2>
            <p className="hero-lead">
              از پرده و کفپوش تا طراحی داخلی؛ خدمات را پیدا کن، نمونه‌کارها را ببین و با کسب‌وکار مرتبط تماس بگیر.
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
                  <input name="location" aria-label="شهر یا محله" placeholder="مثلاً کرج، تهران یا مشهد" />
                </span>
              </label>

              <button type="submit">پیدا کن <ArrowUpLeft size={17} /></button>
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
            <div><strong>جستجوی محلی</strong><span>شهر و محله خودت را انتخاب کن</span></div>
            <div><strong>پروفایل حرفه‌ای</strong><span>برای کسب‌وکارها</span></div>
          </div>

          <a href="/#categories" className="hero-scroll-hint">
            <WandSparkles size={16} /> دیدن دسته‌بندی‌ها
          </a>
        </div>
        <div className="hero-showcase premium-visual-wrap">
          <HeroCoverflow />
        </div>
      </div>
    </section>
  );
}
