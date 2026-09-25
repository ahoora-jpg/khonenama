import { ArrowUpLeft, Images, Sparkles } from "lucide-react";

const items = [
  {
    title: "پرده مدرن و نور طبیعی",
    category: "پرده و پارچه",
    href: "/category/curtain",
    img: "https://khonenama.ir/images/editorial/photo-1513694203232-719a280e022f.webp",
  },
  {
    title: "چوب و کفپوش گرم",
    category: "پارکت و لمینت",
    href: "/category/flooring",
    img: "https://khonenama.ir/images/editorial/photo-1600573472550-8090b5e0745e.webp",
  },
  {
    title: "دیوار شاخص و بافت",
    category: "کاغذ دیواری",
    href: "/category/wallpaper",
    img: "https://khonenama.ir/images/editorial/photo-1615874694520-474822394e73.webp",
  },
  {
    title: "خانه‌ای با نور و بافت",
    category: "طراحی داخلی",
    href: "/category/interior-design",
    img: "https://khonenama.ir/images/editorial/photo-1616486338812-3dadae4b4ace.webp",
  },
];

export default function InspirationGallery() {
  return (
    <section className="section inspiration-showcase" aria-labelledby="inspiration-title">
      <div className="shell">
        <div className="section-heading premium-heading inspiration-heading">
          <div>
            <span className="section-kicker"><Sparkles size={14} /> ایده و نمونه تصویری</span>
            <h2 id="inspiration-title">قبل از انتخاب، فضا و اجرای خوب را ببین.</h2>
            <p>چند تصویر منتخب برای مقایسه سبک، نور، بافت و متریال؛ تصاویر بیشتر داخل راهنماهای تخصصی قرار می‌گیرند.</p>
          </div>
          <a className="text-link-arrow" href="/magazine">
            راهنماهای دکوراسیون <ArrowUpLeft size={16} />
          </a>
        </div>

        <div className="inspiration-masonry">
          {items.map((item, index) => (
            <a
              className={"inspiration-tile inspiration-tile-" + ((index % 4) + 1)}
              href={item.href}
              key={item.title}
              aria-label={item.title}
            >
              <img
                src={item.img}
                alt={item.title}
                width={1200}
                height={675}
                loading="lazy"
                decoding="async"
              />
              <span className="inspiration-scrim" aria-hidden="true" />
              <span className="inspiration-overlay">
                <small>{item.category}</small>
                <strong>{item.title}</strong>
                <span><Images size={14} /> مشاهده ایده</span>
              </span>
            </a>
          ))}
        </div>

        <p className="inspiration-disclaimer">
          تصاویر این بخش برای الهام و نمایش ساختار خونه‌نما هستند و نمونه‌کار کسب‌وکار واقعی محسوب نمی‌شوند؛
          نمونه‌کار واقعی فقط توسط صاحب همان کسب‌وکار در پروفایلش منتشر می‌شود.
        </p>
      </div>
    </section>
  );
}
