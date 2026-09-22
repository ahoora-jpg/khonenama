import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses, getCategory } from "@/lib/demo-data";
import { getCategorySeo } from "@/lib/category-seo";
import { guides } from "@/lib/guides";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { getCategoryVisual, getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BadgeCheck, BookOpen, BriefcaseBusiness, Calculator, Crown, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  const seo = getCategorySeo(slug);
  if (!category || !seo) return {};

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    alternates: { canonical: "/category/" + slug },
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: "https://khonenama.ir/category/" + slug,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  const seo = getCategorySeo(slug);
  if (!category || !seo) notFound();

  const liveBusinesses = await listPublishedBusinesses({ categorySlug: slug, limit: 50 });
  const demoMatches = businesses.filter((business) => business.category === slug);
  const liveSlugs = new Set(liveBusinesses.map((business) => business.slug));
  const matches = [
    ...liveBusinesses.map((business) => ({
      slug: business.slug,
      name: business.name,
      description: business.description,
      city: business.city,
      area: business.area,
      verified: business.verificationStatus === "verified" || business.verificationStatus === "professional",
      rating: business.rating,
      reviewCount: business.reviewCount,
      services: business.services,
      planCode: business.planCode,
      promoted: business.promoted,
      coverUrl: business.media.find((item) => item.kind === "cover")?.url || business.media[0]?.url || "",
      source: "live" as const,
    })),
    ...demoMatches
      .filter((business) => !liveSlugs.has(business.slug))
      .map((business) => ({
        ...business,
        planCode: business.featured ? "premium" as const : "free" as const,
        promoted: Boolean(business.featured),
        coverUrl: business.media?.find((item) => item.cover)?.url || business.media?.[0]?.url || "",
        source: "demo" as const,
      })),
  ];
  const relatedGuides = guides.filter((guide) => seo.guides.includes(guide.slug));
  const visual = getCategoryVisual(slug);

  const categoryUrl = "https://khonenama.ir/category/" + slug;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": categoryUrl + "#businesses",
    name: seo.h1,
    itemListElement: matches.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: "https://khonenama.ir/business/" + business.slug,
      name: business.name,
    })),
  };

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": categoryUrl + "#webpage",
    url: categoryUrl,
    name: seo.h1,
    description: seo.metaDescription,
    inLanguage: "fa-IR",
    isPartOf: { "@id": "https://khonenama.ir/#website" },
    about: relatedGuides.slice(0, 8).map((guide) => ({ "@type": "Thing", name: guide.title })),
    mainEntity: { "@id": categoryUrl + "#businesses" },
    publisher: { "@id": "https://khonenama.ir/#organization" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir/" },
      { "@type": "ListItem", position: 2, name: seo.h1, item: categoryUrl },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <section className="inner-page category-page">
        <div className="shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><span>{seo.h1}</span>
          </nav>

          <div className="category-hero category-hero-with-media glass-panel">
            <div>
              <span className="section-kicker">راهنمای تخصصی خونه‌نما</span>
              <h1>{seo.h1}</h1>
              <p>{seo.intro}</p>
            </div>
            <img src={visual.src} alt={visual.alt} />
          </div>

          <section className="category-seo-copy">
            {seo.sections.map((section) => (
              <div className="category-seo-copy-card" key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.text}</p>
              </div>
            ))}
          </section>

          {slug === "wallpaper" && (
            <section className="category-tool-card glass-panel" aria-label="ابزار محاسبه کاغذ دیواری">
              <span><Calculator size={20} /></span>
              <div>
                <h2>چند رول کاغذ دیواری لازم دارید؟</h2>
                <p>ابعاد دیوار و رول را وارد کنید؛ Pattern Repeat، تلرانس برش و پرت هم در محاسبه لحاظ می‌شوند.</p>
              </div>
              <a href="/tools/wallpaper-calculator">محاسبه تعداد رول <ArrowUpLeft size={14} /></a>
            </section>
          )}

          {slug === "curtain" && (
            <section className="category-tool-card glass-panel" aria-label="ابزار محاسبه پارچه پرده">
              <span><Calculator size={20} /></span>
              <div>
                <h2>برای پرده چند متر پارچه لازم دارید؟</h2>
                <p>عرض ریل، قد پرده، Fullness، عرض پارچه و Pattern Repeat را وارد کنید و متراژ تقریبی پارچه را بگیرید.</p>
              </div>
              <a href="/tools/curtain-fabric-calculator">محاسبه متراژ پرده <ArrowUpLeft size={14} /></a>
            </section>
          )}

          {slug === "smart-home" && (
            <section className="category-tool-card glass-panel" aria-label="ابزار برآورد خانه هوشمند">
              <span><Calculator size={20} /></span>
              <div>
                <h2>قبل از گرفتن قیمت، Scope پروژه را مشخص کنید</h2>
                <p>تعداد نقاط روشنایی، پرده، دما، قفل، سنسور و دوربین را تعریف کنید تا پیشنهاد مجری‌ها قابل‌مقایسه‌تر شود.</p>
              </div>
              <a href="/tools/smart-home-scope">ساخت Scope اولیه <ArrowUpLeft size={14} /></a>
            </section>
          )}

          {relatedGuides.length > 0 && (
            <section className="category-results">
              <div className="section-heading compact-heading">
                <div>
                  <span className="section-kicker">قبل از خرید بخوانید</span>
                  <h2>راهنماهای مرتبط</h2>
                </div>
              </div>

              <div className="category-guide-grid">
                {relatedGuides.slice(0, 8).map((guide) => (
                  <a className="category-guide-card" href={"/magazine/" + guide.slug} key={guide.slug}>
                    <img className="category-guide-thumb" src={getGuideVisual(guide.category).src} alt="" loading="lazy" />
                    <BookOpen size={18} />
                    <div>
                      <h3>{guide.title}</h3>
                      <p>{guide.excerpt}</p>
                    </div>
                    <ArrowUpLeft size={16} />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">کسب‌وکارهای مرتبط</span>
                <h2>فروشگاه‌ها و متخصصان</h2>
              </div>
            </div>

            {matches.length > 0 ? (
              <div className="business-grid">
                {matches.map((business) => (
                  <a className={"business-card plan-card-" + business.planCode} href={"/business/" + business.slug} key={business.slug}>
                    <div className="business-media business-generic">
                      {business.coverUrl ? (
                        <img className="business-card-cover" src={business.coverUrl} alt={business.name} loading="lazy" />
                      ) : (
                        <div className="business-media-shape" />
                      )}
                    </div>
                    <div className="business-content">
                      <div className="business-title-row">
                        <h3>{business.name}</h3>
                        {business.verified && <BadgeCheck size={18} className="verified-icon" />}
                        {business.source === "demo" && <span className="demo-result-badge">نمونه نمایشی</span>}
                        {business.planCode === "pro" && (
                          <span className="plan-listing-badge is-pro"><BriefcaseBusiness size={13} /> حرفه‌ای</span>
                        )}
                        {business.planCode === "premium" && (
                          <span className="plan-listing-badge is-premium"><Crown size={13} /> جایگاه ویژه</span>
                        )}
                      </div>
                      <p>{business.description}</p>
                      <div className="business-meta-row">
                        <span><MapPin size={14} /> {business.city}، {business.area}</span>
                        <span><Star size={14} fill="currentColor" /> {business.reviewCount > 0 ? business.rating : "جدید"}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="category-empty glass-panel">
                <strong>پروفایل‌های این دسته در حال تکمیل هستند.</strong>
                <p>در همین صفحه به‌زودی فروشگاه‌ها و متخصصان مرتبط نمایش داده می‌شوند.</p>
              </div>
            )}
          </section>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">سوالات متداول</span>
                <h2>پرسش‌های رایج</h2>
              </div>
            </div>

            <div className="guide-faq">
              {seo.faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
