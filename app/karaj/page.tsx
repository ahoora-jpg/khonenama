import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { karajAiAnswers } from "@/lib/ai-search-content";
import { ArrowUpLeft, Layers3, MapPin, PaintRoller, PanelsTopLeft, Ruler, Sofa, Wifi } from "lucide-react";

const pageUrl = "https://khonenama.ir/karaj";
const pageTitle = "دکوراسیون داخلی کرج | فروشگاه‌ها، متخصصان و خدمات";
const pageDescription =
  "فروشگاه‌ها، متخصصان و خدمات دکوراسیون داخلی کرج را در خونه‌نما پیدا و مقایسه کنید؛ پرده، موکت، کفپوش، کاغذ دیواری، طراحی داخلی و خانه هوشمند.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: "خونه‌نما",
    locale: "fa_IR",
    type: "website",
  },
  twitter: { card: "summary", title: pageTitle, description: pageDescription },
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
  "@id": pageUrl + "#webpage",
  name: "دکوراسیون داخلی کرج",
  url: pageUrl,
  description:
    "راهنمای محلی خونه‌نما برای پیدا کردن فروشگاه‌ها، متخصصان و خدمات دکوراسیون داخلی در کرج.",
  inLanguage: "fa-IR",
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  about: [
    { "@type": "Thing", name: "دکوراسیون داخلی کرج" },
    ...categories.map(([title]) => ({ "@type": "Thing", name: title })),
  ],
  spatialCoverage: {
    "@type": "City",
    name: "کرج",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: karajAiAnswers.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function KarajPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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

          <section className="category-results" aria-labelledby="karaj-decision-heading">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">پاسخ سریع برای جستجوی محلی</span>
                <h2 id="karaj-decision-heading">قبل از انتخاب فروشگاه یا متخصص در کرج</h2>
              </div>
            </div>
            <div className="local-intent-grid">
              {karajAiAnswers.map((item) => (
                <article className="local-intent-card" key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

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

          <section className="category-results">
            <div className="category-empty glass-panel">
              <strong>صاحب فروشگاه یا متخصص دکوراسیون در کرج هستید؟</strong>
              <p>راهنمای ساخت پروفایل، اطلاعات لازم و نحوه انتشار کسب‌وکار در خونه‌نما را ببینید.</p>
              <a className="pill-button dark" href="/for-business">راهنمای معرفی کسب‌وکار</a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
