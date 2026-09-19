import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses, getCategory } from "@/lib/demo-data";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  const title = `${category.name} در کرج | فروشگاه‌ها و متخصصان`;
  const description = `فروشگاه‌ها و متخصصان ${category.name} در کرج را در خونه‌نما پیدا و مقایسه کنید؛ مشاهده خدمات، محدوده فعالیت و پروفایل کسب‌وکارها.`;

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://khonenama.ir/category/${slug}`,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const matches = businesses.filter((business) => business.category === slug);
  const visibleBusinesses = matches.length ? matches : businesses;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} در کرج`,
    itemListElement: visibleBusinesses.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://khonenama.ir/business/${business.slug}`,
      name: business.name,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Header />
      <section className="inner-page category-page">
        <div className="shell">
          <div className="category-hero glass-panel">
            <span className="section-kicker">دسته‌بندی</span>
            <h1>{category.name} در کرج</h1>
            <p>فروشگاه‌ها، متخصصان و خدمات این حوزه را پیدا کنید، مقایسه کنید و مستقیماً وارد پروفایل هر کسب‌وکار شوید.</p>
          </div>

          <div className="category-results">
            <div className="section-heading compact-heading">
              <div><h2>فروشگاه‌ها و متخصصان</h2></div>
            </div>

            <div className="business-grid">
              {visibleBusinesses.map((business) => (
                <a className="business-card" href={`/business/${business.slug}`} key={business.slug}>
                  <div className="business-media business-generic"><div className="business-media-shape" /></div>
                  <div className="business-content">
                    <div className="business-title-row">
                      <h3>{business.name}</h3>
                      {business.verified && <BadgeCheck size={18} className="verified-icon" />}
                    </div>
                    <p>{business.description}</p>
                    <div className="business-meta-row">
                      <span><MapPin size={14} /> {business.city}، {business.area}</span>
                      <span><Star size={14} fill="currentColor" /> {business.rating}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
