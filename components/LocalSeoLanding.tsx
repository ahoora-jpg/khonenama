import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAiSearchContent } from "@/lib/ai-search-content";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { ArrowUpLeft, BadgeCheck, BriefcaseBusiness, Crown, MapPin, Star } from "lucide-react";

type Faq = { question: string; answer: string };
type GuideLink = { title: string; text: string; href: string };

export type LocalSeoLandingProps = {
  categorySlug: string;
  h1: string;
  intro: string;
  intentCards: { title: string; text: string }[];
  faqs: Faq[];
  guides: GuideLink[];
};

export default async function LocalSeoLanding({
  categorySlug,
  h1,
  intro,
  intentCards,
  faqs,
  guides,
}: LocalSeoLandingProps) {
  const liveBusinesses = await listPublishedBusinesses({
    categorySlug,
    city: "کرج",
    limit: 24,
  });

  const matches = liveBusinesses.map((business) => ({
    slug: business.slug,
    name: business.name,
    description: business.description,
    city: business.city,
    area: business.area,
    verified:
      business.verificationStatus === "verified" ||
      business.verificationStatus === "professional",
    rating: business.rating,
    reviewCount: business.reviewCount,
    planCode: business.planCode,
    coverUrl:
      business.media.find((item) => item.kind === "cover")?.url ||
      business.media[0]?.url ||
      "",
  }));

  const aiAnswers = getAiSearchContent(categorySlug);
  const localUrl = "https://khonenama.ir/karaj/" + categorySlug;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": localUrl + "#businesses",
    name: h1,
    itemListElement: matches.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: business.name,
      url: "https://khonenama.ir/business/" + business.slug,
    })),
  };

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": localUrl + "#webpage",
    url: localUrl,
    name: h1,
    description: intro,
    inLanguage: "fa-IR",
    isPartOf: { "@id": "https://khonenama.ir/#website" },
    about: [
      { "@type": "Thing", name: h1 },
      { "@type": "Place", name: "کرج" },
      ...guides.slice(0, 6).map((guide) => ({ "@type": "Thing", name: guide.title })),
      ...aiAnswers.map((item) => ({ "@type": "Thing", name: item.question })),
    ],
    hasPart: [
      {
        "@type": "CollectionPage",
        name: "راهنمای جامع " + h1.replace(" در کرج", ""),
        url: "https://khonenama.ir/category/" + categorySlug,
      },
      ...guides.slice(0, 6).map((guide) => ({
        "@type": "Article",
        name: guide.title,
        url: guide.href.startsWith("http") ? guide.href : "https://khonenama.ir" + guide.href,
      })),
    ],
    mainEntity: { "@id": localUrl + "#businesses" },
    publisher: { "@id": "https://khonenama.ir/#organization" },
    publishingPrinciples: "https://khonenama.ir/editorial-policy",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir/" },
      { "@type": "ListItem", position: 2, name: "کرج", item: "https://khonenama.ir/karaj" },
      { "@type": "ListItem", position: 3, name: h1, item: localUrl },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...aiAnswers, ...faqs].map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <section className="inner-page">
        <div className="shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/karaj">کرج</a><span>/</span><span>{h1}</span>
          </nav>

          <div className="category-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه‌نما</span>
            <h1>{h1}</h1>
            <p>{intro}</p>
            <a href={"/category/" + categorySlug}>راهنمای جامع این دسته</a>
            <a href="/editorial-policy">روش تدوین و بررسی اطلاعات خونه‌نما</a>
          </div>

          <section className="local-intent-grid">
            {intentCards.map((item) => (
              <div className="local-intent-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            ))}
          </section>

          {aiAnswers.length > 0 && (
            <section className="category-results" aria-labelledby="local-ai-answers-heading">
              <div className="section-heading compact-heading">
                <div>
                  <span className="section-kicker">پاسخ سریع قبل از تماس</span>
                  <h2 id="local-ai-answers-heading">سوال‌های تصمیم‌گیری این دسته</h2>
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

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">کسب‌وکارهای مرتبط</span><h2>فروشگاه‌ها و متخصصان در کرج</h2></div>
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
                          <span className="plan-listing-badge is-pro"><BriefcaseBusiness size={12} /> حرفه‌ای</span>
                        )}
                        {business.planCode === "premium" && (
                          <span className="plan-listing-badge is-premium"><Crown size={12} /> ویژه</span>
                        )}
                      </div>
                      <p>{business.description}</p>
                      <div className="business-meta-row">
                        <span><MapPin size={14} /> {business.city}، {business.area}</span>
                        <span>
                          <Star size={14} fill={business.reviewCount ? "currentColor" : "none"} />
                          {business.reviewCount ? business.rating : "جدید"}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="category-empty glass-panel">
                <strong>هنوز کسب‌وکار منتشرشده‌ای در این دسته نداریم.</strong>
                <p>اگر صاحب فروشگاه یا متخصص این حوزه هستید، ابتدا راهنمای معرفی کسب‌وکار را ببینید؛ فقط اطلاعات واقعی پس از بررسی وارد صفحات عمومی می‌شوند.</p>
                <a className="pill-button dark" href="/for-business">راهنمای معرفی کسب‌وکار</a>
              </div>
            )}
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">راهنمای انتخاب</span><h2>قبل از خرید یا سفارش بخوانید</h2></div>
            </div>
            <div className="category-guide-grid">
              {guides.map((guide) => (
                <a className="category-guide-card" href={guide.href} key={guide.href}>
                  <div><h3>{guide.title}</h3><p>{guide.text}</p></div><ArrowUpLeft size={16} />
                </a>
              ))}
            </div>
          </section>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading"><div><h2>سوالات متداول</h2></div></div>
            <div className="guide-faq">
              {faqs.map((item) => (
                <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
