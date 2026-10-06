import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategory } from "@/lib/demo-data";
import { getCategorySeo } from "@/lib/category-seo";
import { serviceCatalog, servicePath } from "@/lib/service-catalog";
import { BUSINESS_CATEGORIES } from "@/lib/business-taxonomy";
import { getAiSearchContent } from "@/lib/ai-search-content";
import { guides } from "@/lib/guides";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { getCategoryVisual, getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BadgeCheck, BookOpen, BriefcaseBusiness, Calculator, Crown, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";

// Published booths must appear without rebuilding a category page.
export const dynamic = "force-dynamic";

const categoryPillars = [
  { slug: "curtain", label: "پرده و متعلقات" },
  { slug: "flooring", label: "کفپوش و پارکت" },
  { slug: "carpet", label: "موکت" },
  { slug: "wallpaper", label: "کاغذ دیواری و دیوارپوش" },
  { slug: "interior-design", label: "طراحی داخلی" },
  { slug: "smart-home", label: "خانه هوشمند" },
];

const categoryToolUrls: Record<string, string> = {
  flooring: "https://khonenama.ir/tools/flooring-estimator",
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
  const visual = getCategoryVisual(slug);

  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical: "/category/" + slug },
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: "https://khonenama.ir/category/" + slug,
      images: [{ url: visual.src, width: visual.width, height: visual.height, alt: visual.alt }],
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
  const relatedGuides = seo.guides
    .map((guideSlug) => guides.find((guide) => guide.slug === guideSlug))
    .filter((guide): guide is (typeof guides)[number] => Boolean(guide));
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
      ...relatedGuides.slice(0, slug === "curtain" ? 16 : 8).map((guide) => ({ "@type": "Thing", name: guide.title })),
      ...aiAnswers.map((item) => ({ "@type": "Thing", name: item.question })),
    ],
    hasPart: [
      ...relatedGuides.slice(0, slug === "curtain" ? 16 : 8).map((guide) => ({
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
      { "@type": "ListItem", position: 1, name: "خونه نما", item: "https://khonenama.ir/" },
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

  const usedGuideImageSrc = new Set<string>([visual.src]);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <Header />

      <section className="inner-page category-page">
        <div className="shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه نما</a><span>/</span><span>{seo.h1}</span>
          </nav>

          <div className="category-hero category-hero-with-media glass-panel">
            <div>
              <span className="section-kicker">راهنمای تخصصی خونه نما</span>
              <h1>{seo.h1}</h1>
              <p>{seo.intro}</p>
              <a href="/editorial-policy">روش تدوین و بررسی راهنماهای خونه نما</a>
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

          <section className="category-results" aria-label="محصولات و خدمات این دسته">
            <h2>محصولات و خدمات این دسته</h2>
            <p>این فهرست محدوده فعالیت‌های قابل ثبت است؛ ارائه هر مورد به خدمات درج‌شده در غرفه واقعی کسب‌وکار بستگی دارد.</p>
            {[...new Set(serviceCatalog.filter(item => item.category === slug).map(item => item.group))].map(group => <details key={group}><summary>{group}</summary><ul>{serviceCatalog.filter(item => item.category === slug && item.group === group).map(item => <li key={item.name}><a href={servicePath(item)}>{item.name}</a></li>)}</ul></details>)}
            <p>در صفحه هر مورد، فقط غرفه‌هایی نمایش داده می‌شوند که آن محصول یا خدمت را در غرفه خود انتخاب کرده‌اند؛ موجودی و محدوده اجرا را پیش از سفارش تأیید کنید.</p>
          </section>

          <section className="category-results" aria-labelledby="related-pillars-heading">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">مسیرهای مرتبط در فضای داخلی خانه</span>
                <h2 id="related-pillars-heading">موضوعات مرتبط در خونه نما</h2>
              </div>
            </div>
            <div className="local-intent-grid">
              {categoryPillars.filter((item) => item.slug !== slug).map((item) => (
                <a className="local-intent-card" href={`/category/${item.slug}`} key={item.slug}>
                  <h3>{item.label}</h3>
                  <p>راهنماها، ابزارها و کسب‌وکارهای مرتبط با {item.label} را ببینید.</p>
                </a>
              ))}
              <a className="local-intent-card" href="/about">
                <h3>خونه نما چیست؟</h3>
                <p>موضوع، روش کار و تفاوت خونه نما با سایت‌های نمای ساختمان و ملک را ببینید.</p>
              </a>
            </div>
          </section>
          {slug === "flooring" && (
            <section className="category-tool-card glass-panel" aria-label="ابزار محاسبه کفپوش">
              <span><Calculator size={20} /></span>
              <div>
                <h2>چند بسته لمینت یا چند متر کفپوش لازم دارید؟</h2>
                <p>ابعاد فضا، پوشش بسته و پرت را برای پارکت و لمینت محاسبه کنید؛ برای کفپوش رولی، عرض رول و جهت برش را هم وارد کنید.</p>
              </div>
              <a href="/tools/flooring-estimator">محاسبه متراژ و تعداد بسته کفپوش <ArrowUpLeft size={14} /></a>
            </section>
          )}

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
                {relatedGuides.slice(0, slug === "curtain" ? 16 : 8).map((guide) => {
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
              {relatedGuides.length > (slug === "curtain" ? 16 : 8) && (
                <nav aria-label="راهنماهای تکمیلی این دسته">
                  <ul>
                    {relatedGuides.slice(slug === "curtain" ? 16 : 8).map((guide) => (
                      <li key={guide.slug}><a href={"/magazine/" + guide.slug}>{guide.title}</a></li>
                    ))}
                  </ul>
                </nav>
              )}
            </section>
          )}

          <section id="businesses" className="category-results">
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
                          <span className="plan-listing-badge is-premium"><Crown size={13} /> اشتراک ویژه</span>
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
                <a className="pill-button dark" href="/for-business">صاحب کسب‌وکار هستید؟ راهنمای معرفی در خونه نما</a>
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


