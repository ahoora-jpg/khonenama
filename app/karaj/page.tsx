import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpLeft, Layers3, MapPin, PaintRoller, PanelsTopLeft, Ruler, Sofa, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "دکوراسیون داخلی کرج | فروشگاه‌ها، متخصصان و خدمات",
  description:
    "فروشگاه‌ها، متخصصان و خدمات دکوراسیون داخلی کرج را در خونه‌نما پیدا و مقایسه کنید؛ پرده، موکت، کفپوش، کاغذ دیواری، طراحی داخلی و خانه هوشمند.",
  alternates: { canonical: "/karaj" },
};

const categories = [
  ["پرده در کرج", "فروشگاه‌های پرده، پارچه، دوخت و نصب", "/karaj/curtain", PanelsTopLeft],
  ["کفپوش و پارکت در کرج", "لمینت، PVC، پارکت و اجرای تخصصی", "/karaj/flooring", Layers3],
  ["موکت در کرج", "موکت خانگی، اداری و تایلی", "/karaj/carpet", Ruler],
  ["کاغذ دیواری در کرج", "دیوارپوش و کاغذ دیواری مدرن و کلاسیک", "/karaj/wallpaper", PaintRoller],
  ["طراحی داخلی در کرج", "طراح، معمار و مجری دکوراسیون", "/karaj/interior-design", Sofa],
  ["خانه هوشمند در کرج", "روشنایی، پرده برقی، قفل و اتوماسیون", "/karaj/smart-home", Wifi],
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "دکوراسیون داخلی کرج",
  url: "https://khonenama.ir/karaj",
  description:
    "راهنمای محلی خونه‌نما برای پیدا کردن فروشگاه‌ها، متخصصان و خدمات دکوراسیون داخلی در کرج.",
  about: {
    "@type": "Thing",
    name: "دکوراسیون داخلی کرج",
  },
  spatialCoverage: {
    "@type": "City",
    name: "کرج",
  },
};

export default function KarajPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      <section className="inner-page">
        <div className="shell">
          <div className="category-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه‌نما</span>
            <h1>دکوراسیون داخلی کرج</h1>
            <p>
              فروشگاه‌ها، متخصصان و خدمات دکوراسیون منزل را در کرج بر اساس دسته،
              موقعیت و نوع خدمت پیدا و مقایسه کنید.
            </p>
          </div>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">دسته‌بندی‌های پرجستجو</span>
                <h2>برای خانه‌ات چه چیزی لازم داری؟</h2>
              </div>
            </div>

            <div className="local-discovery-grid">
              {categories.map(([title, text, href, Icon]) => (
                <a className="local-discovery-card" href={href} key={href}>
                  <span className="local-discovery-icon"><Icon size={20} /></span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <ArrowUpLeft size={18} className="local-discovery-arrow" />
                </a>
              ))}
            </div>
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">شروع محلی</span>
                <h2>خیابان برغان؛ نقطه شروع خونه‌نما در کرج</h2>
              </div>
            </div>

            <a className="karaj-neighborhood-card glass-panel" href="/karaj/baraghan">
              <span><MapPin size={20} /></span>
              <div>
                <h3>دکوراسیون خیابان برغان کرج</h3>
                <p>پرده، کفپوش، موکت، دیوارپوش و خدمات دکوراسیون در محدوده برغان.</p>
              </div>
              <ArrowUpLeft size={20} />
            </a>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
