import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses } from "@/lib/demo-data";
import { ArrowUpLeft, BadgeCheck, MapPin, Star } from "lucide-react";

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

export default function LocalSeoLanding({
  categorySlug,
  h1,
  intro,
  intentCards,
  faqs,
  guides,
}: LocalSeoLandingProps) {
  const matches = businesses.filter(
    (business) => business.city === "کرج" && business.category === categorySlug
  );

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    itemListElement: matches.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: business.name,
      url: "https://khonenama.ir/business/" + business.slug,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
          </div>

          <section className="local-intent-grid">
            {intentCards.map((item) => (
              <div className="local-intent-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            ))}
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">کسب‌وکارهای مرتبط</span><h2>فروشگاه‌ها و متخصصان در کرج</h2></div>
            </div>
            {matches.length > 0 ? (
              <div className="business-grid">
                {matches.map((business) => (
                  <a className="business-card" href={"/business/" + business.slug} key={business.slug}>
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
            ) : (
              <div className="category-empty glass-panel">
                <strong>پروفایل‌های این دسته در کرج در حال تکمیل هستند.</strong>
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
