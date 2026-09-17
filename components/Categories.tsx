import { ArrowUpLeft, Layers3, PaintRoller, PanelsTopLeft, Ruler, Sofa } from "lucide-react";

const categories = [
  {
    title: "پرده و متعلقات",
    description: "پارچه، زبرا، شید، پانچ، دوخت و نصب",
    className: "category-card category-large category-curtain",
    icon: PanelsTopLeft,
    href: "/category/curtain",
  },
  {
    title: "کفپوش و پارکت",
    description: "لمینت، PVC و اجرای تخصصی",
    className: "category-card category-floor",
    icon: Layers3,
    href: "/category/flooring",
  },
  {
    title: "موکت",
    description: "خانگی، اداری و تایلی",
    className: "category-card category-dark",
    icon: Ruler,
    href: "/category/carpet",
  },
  {
    title: "کاغذ دیواری",
    description: "مدرن، کلاسیک و مینیمال",
    className: "category-card category-wall",
    icon: PaintRoller,
    href: "/category/wallpaper",
  },
  {
    title: "طراحی داخلی",
    description: "طراح، معمار و مجری",
    className: "category-card category-design",
    icon: Sofa,
    href: "/category/interior-design",
  },
];

export default function Categories() {
  return (
    <section className="section" id="categories">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="section-kicker">دسته‌بندی‌ها</span>
            <h2>از چیزی که برای خونه‌ات لازم داری شروع کن.</h2>
          </div>
          <p>
            هر دسته به فروشگاه‌ها، متخصصان، راهنماهای خرید و نتایج محلی خودش وصل می‌شود.
          </p>
        </div>

        <div className="bento-grid">
          {categories.map(({ title, description, className, icon: Icon, href }) => (
            <a className={className} href={href} key={href}>
              <span className="category-icon"><Icon size={21} /></span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <span className="category-arrow"><ArrowUpLeft size={19} /></span>
              <span className="category-shape" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
