import { ArrowUpLeft, Layers3, PaintRoller, PanelsTopLeft, Ruler, Sofa, Wifi } from "lucide-react";

const categories = [
  { title: "پرده و متعلقات", description: "پارچه، زبرا، شید، پانچ، دوخت و نصب", className: "category-card category-large category-curtain", icon: PanelsTopLeft, href: "/category/curtain", number: "01", photo: "photo-1598242822528-182185460969" },
  { title: "کفپوش و پارکت", description: "لمینت، PVC و اجرای تخصصی", className: "category-card category-floor", icon: Layers3, href: "/category/flooring", number: "02", photo: "photo-1780817612741-f8f3785d9908" },
  { title: "موکت", description: "خانگی، اداری و تایلی", className: "category-card category-dark", icon: Ruler, href: "/category/carpet", number: "03", photo: "photo-1628745750110-c8ddcdad2c15" },
  { title: "کاغذ دیواری", description: "مدرن، کلاسیک و مینیمال", className: "category-card category-wall", icon: PaintRoller, href: "/category/wallpaper", number: "04", photo: "photo-1742799431910-985c27143e98" },
  { title: "طراحی داخلی", description: "طراح، معمار و مجری", className: "category-card category-design", icon: Sofa, href: "/category/interior-design", number: "05", photo: "photo-1618221195710-dd6b41faaea6" },
  { title: "خانه هوشمند", description: "روشنایی، پرده برقی، قفل و سناریوهای هوشمند", className: "category-card category-smart", icon: Wifi, href: "/category/smart-home", number: "06", photo: "photo-1600607687920-4e2a09cf159d" },
];

export default function Categories() {
  return (
    <section className="section premium-categories" id="categories">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker">دسته‌بندی‌های خونه‌نما</span>
            <h2>هر گوشه خونه، یک انتخاب بهتر.</h2>
          </div>
          <p>از متریال تا اجرا؛ دسته‌ای را انتخاب کن و فروشگاه‌ها و متخصصان مرتبط را یکجا ببین.</p>
        </div>

        <div className="bento-grid premium-bento">
          {categories.map(({ title, description, className, icon: Icon, href, number, photo }) => {
            const base = `https://khonenama.ir/images/editorial/${photo}.webp`;
            return (
              <a className={`${className} premium-category-card`} href={href} key={href}>
                <img
                  className="category-visual"
                  src={base}
                  width={1200}
                  height={675}
                  alt={`نمونه تصویری ${title}`}
                  loading="lazy"
                  decoding="async"
                />
                <span className="category-visual-overlay" aria-hidden="true" />
                <span className="category-number">{number}</span>
                <span className="category-icon"><Icon size={22} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <span className="category-arrow"><ArrowUpLeft size={19} /></span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
