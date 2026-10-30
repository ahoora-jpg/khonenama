import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HomeBusinessShelf from "@/components/HomeBusinessShelf";
import HomeTools from "@/components/HomeTools";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";

export const dynamic = "force-dynamic";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

const homeTitle = "خونه نما | بازار تخصصی پرده و دکوراسیون";

export const metadata = {
  title: { absolute: homeTitle },
  description:
    "خونه نما، بازار تخصصی پرده و دکوراسیون؛ فروشگاه‌ها و متخصصان پرده، کفپوش، موکت، کاغذ دیواری، طراحی داخلی و خانه هوشمند را مقایسه کنید.",
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description:
      "خونه نما؛ مرجع پیدا کردن و مقایسه فروشگاه‌ها، متخصصان و خدمات دکوراسیون و فضای داخلی خانه.",
    url: "https://khonenama.ir/",
    images: [{ url: "https://khonenama.ir/images/editorial/photo-1602612996819-3cd306f68b4e.webp", width: 1200, height: 675, alt: "کرکره پنجره و نور طبیعی در فضای داخلی" }],
    siteName: "خونه نما",
    locale: "fa_IR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: homeTitle, images: ["https://khonenama.ir/images/editorial/photo-1602612996819-3cd306f68b4e.webp"] },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://khonenama.ir/#website",
  name: "خونه نما",
  alternateName: ["خونه‌نما", "خونهنما", "KhonehNama", "Khoneh Nama", "Khonenama", "Khone Nama", "khonenama.ir"],
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
    { "@type": "Thing", name: "موکت" },
    { "@type": "Thing", name: "نورپردازی داخلی" },
  ],
  publisher: { "@id": "https://khonenama.ir/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://khonenama.ir/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const homePageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://khonenama.ir/#webpage",
  url: "https://khonenama.ir/",
  name: homeTitle,
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  primaryImageOfPage: {
    "@type": "ImageObject",
    contentUrl: "https://khonenama.ir/images/editorial/photo-1602612996819-3cd306f68b4e.webp",
    caption: "کرکره پنجره و نور طبیعی در فضای داخلی",
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
    { "@type": "ListItem", position: 7, name: "نورپردازی داخلی", url: "https://khonenama.ir/category/lighting" },
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://khonenama.ir/#organization",
  name: "خونه نما",
  alternateName: ["خونه‌نما", "خونهنما", "KhonehNama", "Khoneh Nama", "Khonenama", "Khone Nama", "khonenama.ir"],
  url: "https://khonenama.ir/",
  disambiguatingDescription: "خونه نما یک مرجع فارسی برای فضای داخلی خانه و دکوراسیون داخلی است و به طراحی نمای بیرونی ساختمان یا خرید و فروش ملک مربوط نیست.",
  subjectOf: [
    { "@type": "WebPage", url: "https://github.com/ahoora-jpg/khonenama", name: "مخزن پروژه خونه نما در GitHub" },
    { "@type": "WebPage", url: "https://ahoora-studio.site/case-study/khonenama", name: "Khonenama case study — Ahoora Studio" },
    { "@type": "WebPage", url: "https://ahoora-studio.ir/case-study/khonenama", name: "معرفی پروژه خونه نما — Ahoora Studio" },
  ],
  logo: {
    "@type": "ImageObject",
    url: "https://khonenama.ir/khonenama-brand.webp",
    contentUrl: "https://khonenama.ir/khonenama-brand.webp",
    caption: "خونه نما",
  },
  mainEntityOfPage: "https://khonenama.ir/about",
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
    "نورپردازی داخلی",
  ],
  description:
    "خونه نما (Khonenama) مرجع سراسری فضای داخلی خانه و دکوراسیون داخلی برای پیدا کردن و مقایسه فروشگاه‌ها و متخصصان در شهرهای ایران است.",
  areaServed: { "@type": "Country", name: "ایران" },
  publishingPrinciples: "https://khonenama.ir/content-principles",
};

export default async function HomePage() {
  const businesses = await listPublishedBusinesses({ limit: 6 });
  const shelf = businesses.map(b => ({ slug: b.slug, name: b.name, city: b.city, area: b.area, category: b.category, categoryName: b.categoryName, coverUrl: b.media.find(m => m.kind === "cover")?.thumbnailUrl || b.media.find(m => m.kind === "cover")?.url || b.media.find(m => m.kind === "image")?.thumbnailUrl || b.media.find(m => m.kind === "image")?.url || "", verified: ["verified", "professional"].includes(b.verificationStatus), rating: b.rating, reviewCount: b.reviewCount }));
  return (
    <main className="home-compact">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
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
      <HomeBusinessShelf initialBusinesses={shelf} />
      <HomeTools />
      <BusinessCTA />
      <Footer />
    </main>
  );
}
