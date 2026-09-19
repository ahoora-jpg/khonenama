import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBusiness } from "@/lib/demo-data";
import { BadgeCheck, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = getBusiness(slug);
  if (!business) return {};

  const title = `${business.name} | ${business.area}، ${business.city}`;
  const description = `${business.description} خدمات: ${business.services.join("، ")}.`;

  return {
    title,
    description,
    alternates: { canonical: `/business/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://khonenama.ir/business/${slug}`,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = getBusiness(slug);
  if (!business) notFound();

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: business.name,
    description: business.description,
    url: `https://khonenama.ir/business/${business.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.city,
      streetAddress: business.area,
      addressCountry: "IR",
    },
    areaServed: business.city,
    aggregateRating: business.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: business.rating,
      reviewCount: business.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    knowsAbout: business.services,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Header />
      <section className="inner-page business-profile-page">
        <div className="shell">
          <div className="business-profile-hero">
            <div className="profile-cover"><div className="profile-cover-shape" /></div>
            <div className="profile-main-card glass-panel">
              <div className="profile-title-row">
                <div>
                  <div className="profile-name-line">
                    <h1>{business.name}</h1>
                    {business.verified && <BadgeCheck size={22} className="verified-icon" />}
                  </div>
                  <p>{business.description}</p>
                </div>
                {business.featured && <span className="featured-tag profile-featured">ویژه</span>}
              </div>

              <div className="profile-meta-grid">
                <div><MapPin size={17} /><span><strong>موقعیت</strong><small>{business.city}، {business.area}</small></span></div>
                <div><Star size={17} fill="currentColor" /><span><strong>{business.rating}</strong><small>{business.reviewCount} نظر نمایشی</small></span></div>
              </div>

              <div className="profile-actions">
                <a className="pill-button dark" href="#contact"><Phone size={17} /> اطلاعات تماس</a>
                <a className="pill-button profile-secondary" href="#quote"><MessageCircle size={17} /> درخواست قیمت</a>
              </div>
            </div>
          </div>

          <div className="profile-content-grid">
            <section className="profile-section">
              <span className="section-kicker">خدمات</span>
              <h2>خدمات و تخصص‌ها</h2>
              <div className="service-chips">{business.services.map((service) => <span key={service}>{service}</span>)}</div>
            </section>

            <aside className="profile-side-card glass-panel" id="contact">
              <h3>اطلاعات کسب‌وکار</h3>
              <p>اطلاعات تماس، ساعت کاری، واتساپ، نقشه و شبکه‌های اجتماعی پس از تأیید صاحب کسب‌وکار در این بخش نمایش داده می‌شود.</p>
            </aside>
          </div>

          <section className="profile-section">
            <span className="section-kicker">نمونه‌کار</span>
            <h2>گالری پروژه‌ها</h2>
            <div className="portfolio-placeholder-grid">
              <div /><div /><div />
            </div>
          </section>

          <section className="profile-section" id="quote">
            <span className="section-kicker">استعلام</span>
            <h2>درخواست قیمت</h2>
            <p>در نسخه عملیاتی، درخواست شما مستقیماً برای کسب‌وکار ارسال و وضعیت پاسخ در حساب کاربری پیگیری می‌شود.</p>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
