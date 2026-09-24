import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreferredSourceCTA from "@/components/PreferredSourceCTA";
import { guides } from "@/lib/guides";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BookOpen, Clock3 } from "lucide-react";

const magazineUrl = "https://khonenama.ir/magazine";
const magazineTitle = "مجله خونه‌نما | راهنمای دکوراسیون و خانه هوشمند";
const magazineDescription =
  "راهنماهای کاربردی خونه‌نما درباره پرده، پارکت، کفپوش، دیوارپوش، طراحی داخلی، نورپردازی و خانه هوشمند.";

export const metadata: Metadata = {
  title: { absolute: magazineTitle },
  description: magazineDescription,
  alternates: { canonical: magazineUrl },
  openGraph: {
    title: magazineTitle,
    description: magazineDescription,
    url: magazineUrl,
    siteName: "خونه‌نما",
    locale: "fa_IR",
    type: "website",
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": magazineUrl + "#collection",
  url: magazineUrl,
  name: magazineTitle,
  description: magazineDescription,
  inLanguage: "fa-IR",
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  publishingPrinciples: "https://khonenama.ir/editorial-policy",
  about: [
    { "@type": "Thing", name: "پرده و پوشش پنجره" },
    { "@type": "Thing", name: "کفپوش و پارکت" },
    { "@type": "Thing", name: "موکت" },
    { "@type": "Thing", name: "کاغذ دیواری و دیوارپوش" },
    { "@type": "Thing", name: "طراحی داخلی" },
    { "@type": "Thing", name: "خانه هوشمند" },
  ],
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: `https://khonenama.ir/magazine/${guide.slug}`,
    })),
  },
};

export default function MagazinePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <Header />
      <section className="inner-page">
        <div className="shell">
          <div className="category-hero glass-panel magazine-hero">
            <span className="section-kicker">مجله خونه‌نما</span>
            <h1>راهنمای انتخاب برای خانه</h1>
            <p>
              قبل از خرید، فرق گزینه‌ها را بفهمید؛ بعد فروشگاه و متخصص مناسب را پیدا کنید. روش نگارش و به‌روزرسانی مطالب در <a href="/editorial-policy">سیاست تحریریه خونه‌نما</a> توضیح داده شده است.
            </p>
          </div>

          <PreferredSourceCTA />

          <div className="magazine-grid">
            {guides.map((guide) => (
              <article className="magazine-card" key={guide.slug}>
                <img className="magazine-card-image" src={getGuideVisual(guide.category).src} alt={getGuideVisual(guide.category).alt} loading="lazy" />
                <div className="magazine-card-top">
                  <span className="magazine-category">{guide.category}</span>
                  <span className="magazine-readtime"><Clock3 size={13} /> {guide.readTime}</span>
                </div>
                <BookOpen size={22} className="magazine-icon" />
                <h2>{guide.title}</h2>
                <p>{guide.excerpt}</p>
                <a href={"/magazine/" + guide.slug}>
                  مطالعه راهنما <ArrowUpLeft size={15} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
