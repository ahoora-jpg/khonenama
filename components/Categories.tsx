import { ArrowUpLeft, Layers3, PaintRoller, PanelsTopLeft, Ruler, Sofa } from "lucide-react";

const categories = [
  { title: "پرده و متعلقات", description: "پارچه، زبرا، شید، پانچ، دوخت و نصب", className: "category-card category-large category-curtain", icon: PanelsTopLeft, href: "/category/curtain", number: "01" },
  { title: "کفپوش و پارکت", description: "لمینت، PVC و اجرای تخصصی", className: "category-card category-floor", icon: Layers3, href: "/category/flooring", number: "02" },
  { title: "موکت", description: "خانگی، اداری و تایلی", className: "category-card category-dark", icon: Ruler, href: "/category/carpet", number: "03" },
  { title: "کاغذ دیواری", description: "مدرن، کلاسیک و مینیمال", className: "category-card category-wall", icon: PaintRoller, href: "/category/wallpaper", number: "04" },
  { title: "طراحی داخلی", description: "طراح، معمار و مجری", className: "category-card category-design", icon: Sofa, href: "/category/interior-design", number: "05" },
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
          {categories.map(({ title, description, className, icon: Icon, href, number }) => (
            <a className={`${className} premium-category-card`} href={href} key={href}>
              <span className="category-number">{number}</span>
              <span className="category-icon"><Icon size={22} /></span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <span className="category-arrow"><ArrowUpLeft size={19} /></span>
              <span className="category-shape" aria-hidden="true" />
              <span className="category-glow" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
