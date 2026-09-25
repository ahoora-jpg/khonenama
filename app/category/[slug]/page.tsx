import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategory } from "@/lib/demo-data";
import { getCategorySeo } from "@/lib/category-seo";
import { getAiSearchContent } from "@/lib/ai-search-content";
import { guides } from "@/lib/guides";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { getCategoryVisual, getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BadgeCheck, BookOpen, BriefcaseBusiness, Calculator, Crown, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";

const categoryToolUrls: Record<string, string> = {
  curtain: "https://khonenama.ir/tools/curtain-fabric-calculator",
  wallpaper: "https://khonenama.ir/tools/wallpaper-calculator",
  carpet: "https://khonenama.ir/tools/carpet-estimator",
  "smart-home": "https://khonenama.ir/tools/smart-home-scope",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  const seo = getCategorySeo(slug);
  if (!category || !seo) return {};

  return {
    title: { absolute: seo.metaTitle },
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
  const matches = liveBusinesses.map((business) => ({
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
  }));
  const relatedGuides = guides.filter((guide) => seo.guides.includes(guide.slug));
  const aiAnswers = getAiSearchContent(slug);
  const visual = getCategoryVisual(slug);

  const categoryUrl = "https://khonenama.ir/category/" + slug;
  const toolUrl = categoryToolUrls[slug];

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
    about: [
      ...relatedGuides.slice(0, 8).map((guide) => ({ "@type": "Thing", name: guide.title })),
      ...aiAnswers.map((item) => ({ "@type": "Thing", name: item.question })),
    ],
    hasPart: [
      ...relatedGuides.slice(0, 8).map((guide) => ({
        "@type": "WebPage",
        name: guide.title,
        url: "https://khonenama.ir/magazine/" + guide.slug,
      })),
      ...(toolUrl
        ? [{ "@type": "WebApplication", name: "ابزار مرتبط با " + seo.h1, url: toolUrl }]
        : []),
    ],
    mainEntity: { "@id": categoryUrl + "#businesses" },
    publisher: { "@id": "https://khonenama.ir/#organization" },
    publishingPrinciples: "https://khonenama.ir/editorial-policy",
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
    mainEntity: [...aiAnswers, ...seo.faqs].map((faq) => ({
      "@type": "Question",
      name: "question" in faq ? faq.question : "",
      acceptedAnswer: { "@type": "Answer", text: "answer" in faq ? faq.answer : "" },
    })),
  };

  const usedGuideImageSrc = new Set<string>();

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
              <a href="/editorial-policy">روش تدوین و بررسی راهنماهای خونه‌نما</a>
            </div>
            <img src={visual.src} alt={visual.alt} width={visual.width} height={visual.height} loading="eager" fetchPriority="high" decoding="async" />
          </div>

          {aiAnswers.length > 0 && (
            <section className="category-results" aria-labelledby="decision-answers-heading">
              <div className="section-heading compact-heading">
                <div>
                  <span className="section-kicker">پاسخ سریع برای تصمیم‌گیری</span>
                  <h2 id="decision-answers-heading">سوال‌هایی که قبل از انتخاب باید جوابشان را بدانید</h2>
                </div>
              </div>
              <div className="local-intent-grid">
                {aiAnswers.map((item) => (
                  <article className="local-intent-card" key={item.question}>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

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

          {slug === "carpet" && (
            <section className="category-tool-card glass-panel" aria-label="ابزار محاسبه موکت">
              <span><Calculator size={20} /></span>
              <div>
                <h2>چند متر موکت یا چند بسته تایل لازم دارید؟</h2>
                <p>برای موکت رول، عرض رول و جهت نوارها؛ برای موکت تایلی، تعداد تایل و بسته را با پرت محاسبه کنید.</p>
              </div>
              <a href="/tools/carpet-estimator">محاسبه متراژ موکت <ArrowUpLeft size={14} /></a>
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
                {relatedGuides.slice(0, 8).map((guide) => {
                  const guideVisual = getGuideVisual(guide.category, guide.slug);
                  const showThumb = !usedGuideImageSrc.has(guideVisual.src);
                  if (showThumb) usedGuideImageSrc.add(guideVisual.src);
                  return (
                    <a className="category-guide-card" href={"/magazine/" + guide.slug} key={guide.slug}>
                      {showThumb ? (
                        <img className="category-guide-thumb" src={guideVisual.src} alt={guide.title} width={1200} height={675} loading="lazy" decoding="async" />
                      ) : (
                        <div className="category-guide-thumb category-guide-thumb-placeholder" aria-hidden="true" />
                      )}
                      <BookOpen size={18} />
                      <div>
                        <h3>{guide.title}</h3>
                        <p>{guide.excerpt}</p>
                      </div>
                      <ArrowUpLeft size={16} />
                    </a>
                  );
                })}
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
                        <span><Star size={14} fill={business.reviewCount > 0 ? "currentColor" : "none"} /> {business.reviewCount > 0 ? business.rating : "جدید"}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="category-empty glass-panel">
                <strong>هنوز کسب‌وکار منتشرشده‌ای در این دسته نداریم.</strong>
                <p>فقط پروفایل‌های واقعی و منتشرشده در این بخش نمایش داده می‌شوند.</p>
                <a className="pill-button dark" href="/for-business">صاحب کسب‌وکار هستید؟ راهنمای معرفی در خونه‌نما</a>
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
