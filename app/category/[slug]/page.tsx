import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses, getCategory } from "@/lib/demo-data";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const matches = businesses.filter((business) => business.category === slug);

  return (
    <main>
      <Header />
      <section className="inner-page category-page">
        <div className="shell">
          <div className="category-hero glass-panel">
            <span className="section-kicker">دسته‌بندی</span>
            <h1>{category.name}</h1>
            <p>فروشگاه‌ها، متخصصان، خدمات و راهنماهای خرید این دسته را در یک صفحه پیدا کنید.</p>
          </div>

          <div className="category-results">
            <div className="section-heading compact-heading">
              <div><h2>نتایج نمونه در کرج</h2></div>
            </div>

            <div className="business-grid">
              {(matches.length ? matches : businesses).map((business) => (
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
