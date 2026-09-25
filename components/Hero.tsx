import { ArrowUpLeft, MapPin, Search, Sparkles, WandSparkles } from "lucide-react";

const popular = [
  ["پرده", "/search?q=پرده&location=کرج"],
  ["موکت", "/search?q=موکت&location=کرج"],
  ["پارکت", "/search?q=پارکت&location=کرج"],
  ["کاغذ دیواری", "/search?q=کاغذ+دیواری&location=کرج"],
] as const;

const heroImageBase = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0";

export default function Hero() {
  return (
    <section className="hero premium-hero hero-editorial-layout" id="top">
      <div className="shell hero-editorial-shell">
        <header className="hero-identity-block">
          <div className="eyebrow hero-brand-label">
            <Sparkles size={15} />
            خونه‌نما؛ انتخاب آگاهانه برای خانه
          </div>

          <h1 className="hero-identity-title">
            مرجع تخصصی دکوراسیون و تزئینات داخلی منزل
          </h1>
        </header>

        <div className="hero-showcase premium-visual-wrap">
          <div className="hero-visual-frame" style={{ overflow: "hidden", borderRadius: 28 }}>
            <img
              src={`${heroImageBase}?auto=format&fit=crop&w=960&q=72`}
              srcSet={`${heroImageBase}?auto=format&fit=crop&w=640&q=70 640w, ${heroImageBase}?auto=format&fit=crop&w=960&q=72 960w, ${heroImageBase}?auto=format&fit=crop&w=1200&q=74 1200w`}
              sizes="(max-width: 700px) 94vw, (max-width: 1100px) 88vw, 1100px"
              width={1200}
              height={675}
              alt="فضای داخلی روشن و مدرن برای انتخاب آگاهانه دکوراسیون منزل"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{ width: "100%", height: "clamp(260px, 46vw, 520px)", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>

        <div className="hero-after-showcase">
          <div className="hero-after-copy">
            <h2 className="hero-slogan">برای خونه‌ات، بهتر انتخاب کن.</h2>
            <p className="hero-lead">
              فروشگاه‌ها، متخصصان، محصولات و ایده‌های دکوراسیون را پیدا کن، مقایسه کن
              و مستقیم با بهترین گزینه‌های اطرافت ارتباط بگیر.
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
