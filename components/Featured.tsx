import { ArrowUpLeft, BadgeCheck, MapPin, Phone, Sparkles, Star } from "lucide-react";
import { businesses } from "@/lib/demo-data";

const demos = businesses
  .filter((business) => business.featured || business.media?.length)
  .slice(0, 6);

export default function Featured() {
  return (
    <section className="section section-soft premium-featured" id="featured">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker">پروفایل‌های نمونه خونه‌نما</span>
            <h2>یک پروفایل کامل چه شکلی است؟</h2>
          </div>
          <p>این نمونه‌ها برای نمایش امکانات خونه‌نما هستند؛ کسب‌وکارهای واقعی بعد از ثبت، با اطلاعات و نمونه‌کار خودشان نمایش داده می‌شوند.</p>
        </div>

        <div className="business-grid premium-business-grid">
          {demos.map((item) => {
            const cover = item.media?.find((media) => media.cover) || item.media?.[0];
            return (
              <article className="business-card glare-card premium-business-card" key={item.slug}>
                <div className="business-media">
                  {cover ? (
                    <img className="business-card-cover" src={cover.url} alt={cover.alt} loading="lazy" />
                  ) : (
                    <div className="business-media-shape" />
                  )}
                  <span className="demo-label"><Sparkles size={13} /> پروفایل نمونه</span>
                  {item.featured && <span className="featured-tag">ویژه</span>}
                  <div className="media-depth-layer" />
                </div>
                <div className="business-content">
                  <div className="business-title-row">
                    <h3>{item.name}</h3>
                    {item.verified && <BadgeCheck size={19} className="verified-icon" />}
                  </div>
                  <p>{item.services.slice(0, 3).join("، ")}</p>
                  <div className="business-meta-row">
                    <span><MapPin size={14} /> {item.city}، {item.area}</span>
                    <span>
                      <Star size={14} fill={item.reviewCount ? "currentColor" : "none"} />
                      {item.reviewCount ? item.rating : "جدید"}
                    </span>
                  </div>
                  <div className="business-actions">
                    <a href={"/business/" + item.slug} className="business-button primary">
                      مشاهده پروفایل <ArrowUpLeft size={16} />
                    </a>
                    <a href={"/business/" + item.slug} className="business-button" aria-label="مشاهده و تماس">
                      <Phone size={16} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
