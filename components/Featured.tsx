import { ArrowUpLeft, BadgeCheck, MapPin, Phone, Star } from "lucide-react";

const demos = [
  { slug: "demo-curtain-baraghan", title: "نمونه پرده‌فروشی", kind: "پرده، پارچه و دوخت", area: "خیابان برغان", tone: "terracotta" },
  { slug: "demo-flooring-jahanshahr", title: "نمونه کفپوش", kind: "پارکت، لمینت و اجرا", area: "جهانشهر", tone: "sage" },
  { slug: "demo-wallpaper-gohardasht", title: "نمونه دیوارپوش", kind: "کاغذ دیواری و دیوارپوش", area: "گوهردشت", tone: "charcoal" },
];

export default function Featured() {
  return (
    <section className="section section-soft" id="featured">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="section-kicker">منتخب‌ها</span>
            <h2>کسب‌وکارهایی که قرار است راحت‌تر دیده شوند.</h2>
          </div>
          <p>این کارت‌ها فعلاً داده نمایشی دارند و بعد به دیتابیس واقعی فروشگاه‌ها متصل می‌شوند.</p>
        </div>

        <div className="business-grid">
          {demos.map((item, index) => (
            <article className={`business-card glare-card business-${item.tone}`} key={item.slug}>
              <div className="business-media">
                <span className="demo-label">نمونه نمایشی</span>
                {index === 0 && <span className="featured-tag">ویژه</span>}
                <div className="business-media-shape" />
              </div>
              <div className="business-content">
                <div className="business-title-row">
                  <h3>{item.title}</h3>
                  <BadgeCheck size={19} className="verified-icon" />
                </div>
                <p>{item.kind}</p>
                <div className="business-meta-row">
                  <span><MapPin size={14} /> کرج، {item.area}</span>
                  <span><Star size={14} fill="currentColor" /> ۴.۹</span>
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
