import { ArrowUpLeft, Images, Sparkles } from "lucide-react";
import { businesses } from "@/lib/demo-data";

const items = businesses
  .flatMap((business) =>
    (business.media || []).slice(0, 2).map((media) => ({
      ...media,
      businessName: business.name,
      businessSlug: business.slug,
      category: business.category,
    }))
  )
  .slice(0, 12);

export default function InspirationGallery() {
  return (
    <section className="section inspiration-showcase" aria-labelledby="inspiration-title">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker"><Sparkles size={14} /> ایده و نمونه‌کار</span>
            <h2 id="inspiration-title">قبل از انتخاب، فضا و اجرای خوب را ببین.</h2>
          </div>
          <a className="text-link-arrow" href="/magazine">
            راهنماهای دکوراسیون <ArrowUpLeft size={16} />
          </a>
        </div>

        <div className="inspiration-masonry">
          {items.map((item, index) => (
            <a
              className={"inspiration-tile inspiration-tile-" + ((index % 6) + 1)}
              href={"/business/" + item.businessSlug}
              key={item.businessSlug + "-" + index}
            >
              <img src={item.url} alt={item.alt} loading={index > 3 ? "lazy" : "eager"} />
              <span className="inspiration-overlay">
                <Images size={15} />
                <strong>{item.businessName}</strong>
                <small>مشاهده پروفایل نمونه</small>
              </span>
            </a>
          ))}
        </div>

        <p className="inspiration-disclaimer">
          تصاویر این بخش برای نمایش تجربه و ساختار نمونه خونه‌نما هستند؛ نمونه‌کار کسب‌وکارهای واقعی فقط توسط صاحب همان کسب‌وکار منتشر می‌شود.
        </p>
      </div>
    </section>
  );
}
