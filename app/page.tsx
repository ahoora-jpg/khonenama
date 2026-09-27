import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import HomeTools from "@/components/HomeTools";
import InspirationGallery from "@/components/InspirationGallery";
import LocalDiscovery from "@/components/LocalDiscovery";
import GuidesHome from "@/components/GuidesHome";
import HowItWorks from "@/components/HowItWorks";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

const homeTitle = "خونه نما | دکوراسیون داخلی و فضای داخلی خانه";

export const metadata = {
  title: { absolute: homeTitle },
  description:
    "خونه نما (Khonenama) مرجع دکوراسیون و فضای داخلی خانه است؛ فروشگاه‌ها و متخصصان پرده، کفپوش، موکت، کاغذ دیواری، طراحی داخلی و خانه هوشمند را مقایسه کنید.",
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description:
      "خونه نما؛ مرجع پیدا کردن و مقایسه فروشگاه‌ها، متخصصان و خدمات دکوراسیون و فضای داخلی خانه.",
    url: "https://khonenama.ir/",
    siteName: "خونه نما",
    locale: "fa_IR",
    type: "website",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://khonenama.ir/#website",
  name: "خونه نما",
  alternateName: ["خونه‌نما", "Khonenama", "Khonenama.ir", "khonenama.ir"],
  url: "https://khonenama.ir/",
  inLanguage: "fa-IR",
  disambiguatingDescription: "خونه نما (Khonenama) درباره دکوراسیون و فضای داخلی خانه است؛ نه نمای بیرونی ساختمان، پلان معماری یا خرید و فروش ملک.",
  about: [
    { "@type": "Thing", name: "دکوراسیون داخلی" },
    { "@type": "Thing", name: "پرده و پوشش پنجره" },
    { "@type": "Thing", name: "کفپوش و پارکت" },
    { "@type": "Thing", name: "کاغذ دیواری" },
    { "@type": "Thing", name: "طراحی داخلی" },
    { "@type": "Thing", name: "خانه هوشمند" },
  ],
  publisher: { "@id": "https://khonenama.ir/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://khonenama.ir/search?q={search_term_string}&location=کرج",
    },
    "query-input": "required name=search_term_string",
  },
};

const categoryListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "دسته‌بندی‌های دکوراسیون خونه نما",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "پرده و متعلقات", url: "https://khonenama.ir/category/curtain" },
    { "@type": "ListItem", position: 2, name: "کفپوش و پارکت", url: "https://khonenama.ir/category/flooring" },
    { "@type": "ListItem", position: 3, name: "موکت", url: "https://khonenama.ir/category/carpet" },
    { "@type": "ListItem", position: 4, name: "کاغذ دیواری", url: "https://khonenama.ir/category/wallpaper" },
    { "@type": "ListItem", position: 5, name: "طراحی داخلی", url: "https://khonenama.ir/category/interior-design" },
    { "@type": "ListItem", position: 6, name: "خانه هوشمند", url: "https://khonenama.ir/category/smart-home" },
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://khonenama.ir/#organization",
  name: "خونه نما",
  alternateName: ["خونه‌نما", "Khonenama", "Khonenama.ir", "khonenama.ir"],
  url: "https://khonenama.ir/",
  disambiguatingDescription: "خونه نما یک مرجع فارسی برای فضای داخلی خانه و دکوراسیون داخلی است و به طراحی نمای بیرونی ساختمان یا خرید و فروش ملک مربوط نیست.",
  sameAs: ["https://github.com/ahoora-jpg/khonenama"],
  subjectOf: [
    { "@type": "WebPage", url: "https://ahoora-studio.site/case-study/khonenama", name: "Khonenama case study — Ahoora Studio" },
    { "@type": "WebPage", url: "https://ahoora-studio.ir/case-study/khonenama", name: "معرفی پروژه خونه نما — Ahoora Studio" },
  ],
  logo: {
    "@type": "ImageObject",
    url: "https://khonenama.ir/khonenama-logo.svg",
    contentUrl: "https://khonenama.ir/khonenama-logo.svg",
    caption: "خونه نما",
  },
  mainEntityOfPage: "https://khonenama.ir/about",
  publishingPrinciples: "https://khonenama.ir/editorial-policy",
  knowsAbout: [
    "فضای داخلی خانه",
    "دکوراسیون داخلی منزل",
    "تزئینات داخلی منزل",
    "پرده و پوشش پنجره",
    "کفپوش و پارکت",
    "موکت",
    "کاغذ دیواری و دیوارپوش",
    "طراحی داخلی",
    "خانه هوشمند",
  ],
  description:
    "خونه نما (Khonenama) مرجع فضای داخلی خانه و دکوراسیون داخلی برای پیدا کردن و مقایسه فروشگاه‌ها و متخصصان مرتبط است، با شروع از کرج و خیابان برغان.",
  areaServed: [
    { "@type": "City", name: "کرج" },
    { "@type": "AdministrativeArea", name: "البرز" },
  ],
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryListJsonLd) }}
      />
      <Header />
      <Hero />
      <section className="brand-definition" aria-labelledby="brand-definition-title">
        <div className="shell">
          <div className="brand-definition-card glass-panel">
            <span className="section-kicker">تعریف خونه نما</span>
            <h2 id="brand-definition-title">خونه نما چیست؟</h2>
            <p>
              خونه نما (Khonenama) مرجع فارسی دکوراسیون و فضای داخلی خانه است؛ برای شناخت و مقایسه پرده، کفپوش، موکت، کاغذ دیواری، طراحی داخلی، خانه هوشمند و کسب‌وکارهای مرتبط. موضوع خونه نما نمای بیرونی ساختمان، پلان معماری یا خرید و فروش ملک نیست.
            </p>
            <a href="/about">درباره خونه نما و نحوه کار پلتفرم</a>
          </div>
        </div>
      </section>
      <Categories />
      <HomeTools />
      <InspirationGallery />
      <LocalDiscovery />
      <GuidesHome />
      <HowItWorks />
      <BusinessCTA />
      <Footer />
    </main>
  );
}
