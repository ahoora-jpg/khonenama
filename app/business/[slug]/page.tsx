import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import BusinessReviews from "@/components/BusinessReviews";
import { businesses as demoBusinesses, getBusiness } from "@/lib/demo-data";
import { getPublishedBusiness, getBusinessSlugRedirect, listPublishedBusinesses } from "@/lib/server/public-businesses";
import { BadgeCheck, BriefcaseBusiness, Clock3, Crown, Globe2, Instagram, MapPin, MessageCircle, Phone, Star } from "lucide-react";
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
      category: demo.category,
      rating: demo.rating,
      reviewCount: demo.reviewCount,
      planCode: demo.featured ? "premium" as const : "free" as const,
      planName: demo.featured ? "ویژه" : "پایه",
      hours: [],
      reviews: [],
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
    category: live.category,
    rating: live.rating,
    reviewCount: live.reviewCount,
    planCode: live.planCode,
    planName: live.planName,
    media: live.media,
    hours: live.hours,
    reviews: live.reviews,
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
      images: business.media[0]?.url ? [{ url: business.media[0].url, alt: business.media[0].altText || business.name }] : undefined,
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

  const liveRelated = business.category
    ? await listPublishedBusinesses({ categorySlug: business.category, city: business.city, limit: 6 })
    : [];
  const relatedLive = liveRelated
    .filter((item) => item.slug !== business.slug)
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      city: item.city,
      area: item.area,
      verified: item.verificationStatus === "verified" || item.verificationStatus === "professional",
      rating: item.rating,
      reviewCount: item.reviewCount,
      coverUrl: item.media.find((media) => media.kind === "cover")?.url || item.media[0]?.url || "",
      demo: false,
    }));
  const relatedSlugs = new Set(relatedLive.map((item) => item.slug));
  const relatedDemo = demoBusinesses
    .filter(
      (item) =>
        item.slug !== business.slug &&
        item.category === business.category &&
        !relatedSlugs.has(item.slug)
    )
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      city: item.city,
      area: item.area,
      verified: item.verified,
      rating: item.rating,
      reviewCount: item.reviewCount,
      coverUrl: item.media?.find((media) => media.cover)?.url || item.media?.[0]?.url || "",
      demo: true,
    }));
  const relatedBusinesses = [...relatedLive, ...relatedDemo].slice(0, 4);

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
    review: business.reviews.slice(0, 5).map((item: any) => ({
      "@type": "Review",
      author: { "@type": "Person", name: item.name },
      reviewRating: { "@type": "Rating", ratingValue: item.rating, bestRating: 5, worstRating: 1 },
      reviewBody: item.body,
    })),
    knowsAbout: business.services,
    openingHoursSpecification: business.hours
      .filter((item: any) => !item.isClosed && item.opensAt && item.closesAt)
      .map((item: any) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][item.weekday],
        opens: item.opensAt,
        closes: item.closesAt,
      })),
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
                    {business.isDemo && <span className="demo-profile-pill">نمونه نمایشی</span>}
                    {business.source === "demo" && <span className="demo-profile-badge">پروفایل نمونه</span>}
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
              {business.hours.length > 0 && (
                <div className="public-hours">
                  <strong><Clock3 size={14} /> ساعات کاری</strong>
                  {business.hours.map((item: any) => (
                    <span key={item.weekday}>
                      <b>{["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"][item.weekday]}</b>
                      <small>{item.isClosed ? "تعطیل" : item.opensAt + " تا " + item.closesAt}</small>
                    </span>
                  ))}
                </div>
              )}
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

          <BusinessReviews
            businessSlug={business.slug}
            businessName={business.name}
            reviews={business.reviews}
            rating={business.rating}
            reviewCount={business.reviewCount}
            demo={business.source === "demo"}
          />

          <section className="profile-section quote-section" id="quote">
            <span className="section-kicker">استعلام</span>
            <h2>درخواست قیمت</h2>
            {business.source === "d1" ? (
              <QuoteRequestForm businessSlug={business.slug} businessName={business.name} />
            ) : (
              <div className="demo-quote-note glass-panel">
                این یک پروفایل نمونه برای نمایش تجربه خونه‌نماست. درخواست قیمت واقعی فقط برای کسب‌وکارهای ثبت‌شده فعال می‌شود.
              </div>
            )}
          </section>

          {relatedBusinesses.length > 0 && (
            <section className="profile-section related-businesses-section">
              <div className="section-heading compact-heading">
                <div>
                  <span className="section-kicker">گزینه‌های مشابه</span>
                  <h2>کسب‌وکارهای مرتبط</h2>
                </div>
              </div>
              <div className="related-business-grid">
                {relatedBusinesses.map((item) => (
                  <a className="related-business-card glass-panel" href={"/business/" + item.slug} key={item.slug}>
                    <div className="related-business-media">
                      {item.coverUrl ? <img src={item.coverUrl} alt={item.name} loading="lazy" /> : <span />}
                      {item.demo && <small>نمونه</small>}
                    </div>
                    <div>
                      <h3>{item.name} {item.verified && <BadgeCheck size={14} className="verified-icon" />}</h3>
                      <p><MapPin size={12} /> {item.city}، {item.area}</p>
                      <span><Star size={12} fill={item.reviewCount ? "currentColor" : "none"} /> {item.reviewCount ? item.rating : "جدید"}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
