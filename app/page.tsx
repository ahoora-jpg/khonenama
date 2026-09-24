import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import HomeTools from "@/components/HomeTools";
import InspirationGallery from "@/components/InspirationGallery";
import Featured from "@/components/Featured";
import LocalDiscovery from "@/components/LocalDiscovery";
import GuidesHome from "@/components/GuidesHome";
import HowItWorks from "@/components/HowItWorks";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

const homeTitle = "خونه‌نما | مرجع تخصصی دکوراسیون و تزئینات داخلی منزل";

export const metadata = {
  title: { absolute: homeTitle },
  description:
    "مرجع تخصصی دکوراسیون و تزئینات داخلی منزل؛ فروشگاه‌ها، متخصصان، پرده، موکت، کفپوش، کاغذ دیواری، طراحی داخلی و خانه هوشمند را پیدا و مقایسه کنید.",
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description:
      "فروشگاه‌ها، متخصصان و خدمات دکوراسیون منزل را در خونه‌نما پیدا و مقایسه کنید.",
    url: "https://khonenama.ir",
    siteName: "خونه‌نما",
    locale: "fa_IR",
    type: "website",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://khonenama.ir/#website",
  name: "خونه‌نما",
  alternateName: "Khonenama",
  url: "https://khonenama.ir",
  inLanguage: "fa-IR",
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
  name: "دسته‌بندی‌های دکوراسیون خونه‌نما",
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
  name: "خونه‌نما",
  alternateName: "Khonenama",
  url: "https://khonenama.ir",
  logo: {
    "@type": "ImageObject",
    url: "https://khonenama.ir/khonenama-logo.svg",
    contentUrl: "https://khonenama.ir/khonenama-logo.svg",
    caption: "خونه‌نما",
  },
  mainEntityOfPage: "https://khonenama.ir/about",
  publishingPrinciples: "https://khonenama.ir/editorial-policy",
  knowsAbout: ["پرده و پوشش پنجره", "کفپوش و پارکت", "موکت", "کاغذ دیواری و دیوارپوش", "طراحی داخلی", "خانه هوشمند"],
  description:
    "مرجع پیدا کردن و مقایسه فروشگاه‌ها و متخصصان دکوراسیون منزل، با شروع از کرج و خیابان برغان.",
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
      <Categories />
      <HomeTools />
      <InspirationGallery />
      <LocalDiscovery />
      <GuidesHome />
      <Featured />
      <HowItWorks />
      <BusinessCTA />
      <Footer />
    </main>
  );
}
