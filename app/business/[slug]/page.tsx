import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBusiness } from "@/lib/demo-data";
import { getPublishedBusiness, getBusinessSlugRedirect } from "@/lib/server/public-businesses";
import { BadgeCheck, BriefcaseBusiness, Crown, Globe2, Instagram, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";

async function resolveBusiness(slug: string) {
  const demo = getBusiness(slug);
  if (demo) {
    return {
      source: "demo" as const,
      slug: demo.slug,
      name: demo.name,
      description: demo.description,
      city: demo.city,
      area: demo.area,
      address: "",
      phone: "",
      website: "",
      instagram: "",
      verified: demo.verified,
      featured: demo.featured,
      services: demo.services,
      rating: demo.rating,
      reviewCount: demo.reviewCount,
      planCode: demo.featured ? "premium" as const : "free" as const,
      planName: demo.featured ? "ویژه" : "پایه",
      media: (demo.media || []).map((item, index) => ({
        id: index + 1,
        kind: item.cover ? "cover" : "image",
        url: item.url,
        thumbnailUrl: item.url,
        altText: item.alt,
        sortOrder: index + 1,
      })),
    };
  }

  const live = await getPublishedBusiness(slug);
  if (!live) return null;

  return {
    source: "d1" as const,
    slug: live.slug,
    name: live.name,
    description: live.description,
    city: live.city,
    area: live.area,
    address: live.address,
    phone: live.phone,
    website: live.website,
    instagram: live.instagram,
    verified: live.verificationStatus === "verified" || live.verificationStatus === "professional",
    featured: live.featured,
    services: live.services,
    rating: live.rating,
    reviewCount: live.reviewCount,
    planCode: live.planCode,
    planName: live.planName,
    media: live.media,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = await resolveBusiness(slug);
  if (!business) return {};

  const title = business.name + " | " + [business.area, business.city].filter(Boolean).join("، ");
  const description = business.description || ("پروفایل " + business.name + " در خونه‌نما");

  return {
    title,
    description,
    alternates: { canonical: "/business/" + slug },
    openGraph: {
      title,
      description,
      url: "https://khonenama.ir/business/" + slug,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await resolveBusiness(slug);
  if (!business) {
    const redirectSlug = await getBusinessSlugRedirect(slug);
    if (redirectSlug && redirectSlug !== slug) {
      permanentRedirect("/business/" + redirectSlug);
    }
    notFound();
  }

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: business.name,
    description: business.description,
    url: "https://khonenama.ir/business/" + business.slug,
    telephone: business.phone || undefined,
    sameAs: [business.website, business.instagram].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      addressLocality: business.city,
      streetAddress: business.address || business.area,
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
            <div className="profile-cover">
              {business.media.find((item: any) => item.kind === "cover")?.url ? (
                <img
                  className="profile-cover-image"
                  src={business.media.find((item: any) => item.kind === "cover")?.url}
                  alt={business.media.find((item: any) => item.kind === "cover")?.altText || business.name}
                />
              ) : (
                <div className="profile-cover-shape" />
              )}
            </div>
            <div className={"profile-main-card glass-panel plan-" + business.planCode}>
              <div className="profile-title-row">
                <div>
                  <div className="profile-name-line">
                    <h1>{business.name}</h1>
                    {business.verified && <BadgeCheck size={22} className="verified-icon" />}
                    {business.planCode === "pro" && (
                      <span className="plan-public-badge is-pro"><BriefcaseBusiness size={14} /> حرفه‌ای</span>
                    )}
                    {business.planCode === "premium" && (
                      <span className="plan-public-badge is-premium"><Crown size={14} /> ویژه</span>
                    )}
                  </div>
                  <p>{business.description}</p>
                </div>
                {business.planCode === "premium" && <span className="featured-tag profile-featured">جایگاه ویژه</span>}
              </div>

              <div className="profile-meta-grid">
                <div><MapPin size={17} /><span><strong>موقعیت</strong><small>{business.city}، {business.area}</small></span></div>
                <div><Star size={17} fill="currentColor" /><span><strong>{business.reviewCount ? business.rating : "جدید"}</strong><small>{business.reviewCount ? business.reviewCount + " نظر" : "بدون نظر"}</small></span></div>
              </div>

              <div className="profile-actions">
                {business.phone ? (
                  <a className="pill-button dark" href={"tel:" + business.phone}><Phone size={17} /> تماس</a>
                ) : (
                  <a className="pill-button dark" href="#contact"><Phone size={17} /> اطلاعات تماس</a>
                )}
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
              {business.address && <p><MapPin size={14} /> {business.address}</p>}
              {business.phone && <a href={"tel:" + business.phone}><Phone size={14} /> {business.phone}</a>}
              {business.website && <a href={business.website} target="_blank" rel="noreferrer"><Globe2 size={14} /> وب‌سایت</a>}
              {business.instagram && <a href={business.instagram.startsWith("http") ? business.instagram : "https://instagram.com/" + business.instagram.replace(/^@/, "")} target="_blank" rel="noreferrer"><Instagram size={14} /> اینستاگرام</a>}
              {!business.address && !business.phone && !business.website && !business.instagram && (
                <p>اطلاعات تماس پس از تکمیل و تأیید صاحب کسب‌وکار در این بخش نمایش داده می‌شود.</p>
              )}
            </aside>
          </div>

          <section className="profile-section">
            <span className="section-kicker">نمونه‌کار</span>
            <h2>گالری پروژه‌ها</h2>
            {business.media.length ? (
              <div className="business-public-gallery">
                {business.media.map((item: any) => (
                  <figure className={item.kind === "cover" ? "is-cover" : ""} key={item.id}>
                    <img src={item.url} alt={item.altText || business.name + " نمونه‌کار"} loading="lazy" />
                    {item.altText && <figcaption>{item.altText}</figcaption>}
                  </figure>
                ))}
              </div>
            ) : (
              <div className="portfolio-placeholder-grid">
                <div /><div /><div />
              </div>
            )}
          </section>

          <section className="profile-section" id="quote">
            <span className="section-kicker">استعلام</span>
            <h2>درخواست قیمت</h2>
            <p>در مرحله بعد، درخواست مشتری مستقیماً برای همین کسب‌وکار ثبت و در پنل قابل پیگیری خواهد شد.</p>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
