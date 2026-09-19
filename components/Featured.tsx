import { ArrowUpLeft, BadgeCheck, MapPin, Phone, Sparkles, Star } from "lucide-react";

const demos = [
  { slug: "demo-curtain-baraghan", title: "پرده‌سرای برغان", kind: "پرده، پارچه، دوخت و نصب", area: "خیابان برغان", tone: "terracotta", score: "۴.۹" },
  { slug: "demo-flooring-jahanshahr", title: "استودیو کف و چوب", kind: "پارکت، لمینت و اجرا", area: "جهانشهر", tone: "sage", score: "۴.۸" },
  { slug: "demo-wallpaper-gohardasht", title: "خانه دیوار", kind: "کاغذ دیواری و دیوارپوش", area: "گوهردشت", tone: "charcoal", score: "۴.۷" },
];

export default function Featured() {
  return (
    <section className="section section-soft premium-featured" id="featured">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker">منتخب‌های خونه‌نما</span>
            <h2>پروفایل‌هایی که باید دیده شوند.</h2>
          </div>
          <p>طراحی این کارت‌ها برای معرفی حرفه‌ای برند، خدمات، موقعیت و نمونه‌کار هر کسب‌وکار است.</p>
        </div>

        <div className="business-grid premium-business-grid">
          {demos.map((item, index) => (
            <article className={`business-card glare-card premium-business-card business-${item.tone}`} key={item.slug}>
              <div className="business-media">
                <span className="demo-label"><Sparkles size={13} /> منتخب خونه‌نما</span>
                {index === 0 && <span className="featured-tag">ویژه</span>}
                <div className="business-media-shape" />
                <div className="media-depth-layer" />
              </div>
              <div className="business-content">
                <div className="business-title-row">
                  <h3>{item.title}</h3>
                  <BadgeCheck size={19} className="verified-icon" />
                </div>
                <p>{item.kind}</p>
                <div className="business-meta-row">
                  <span><MapPin size={14} /> کرج، {item.area}</span>
                  <span><Star size={14} fill="currentColor" /> {item.score}</span>
                </div>
                <div className="business-actions">
                  <a href={`/business/${item.slug}`} className="business-button primary">مشاهده پروفایل <ArrowUpLeft size={16} /></a>
                  <a href={`/business/${item.slug}`} className="business-button" aria-label="تماس"><Phone size={16} /></a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
