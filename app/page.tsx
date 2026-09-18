import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import Featured from "@/components/Featured";
import HowItWorks from "@/components/HowItWorks";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "خونه‌نما",
  alternateName: "Khonenama",
  url: "https://khonenama.ir",
  inLanguage: "fa-IR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://khonenama.ir/search?q={search_term_string}&location=کرج",
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "خونه‌نما",
  alternateName: "Khonenama",
  url: "https://khonenama.ir",
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
      <Header />
      <Hero />
      <Categories />
      <Featured />
      <HowItWorks />
      <BusinessCTA />
      <Footer />
    </main>
  );
}
