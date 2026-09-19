import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses, getCategory } from "@/lib/demo-data";
import { getCategorySeo } from "@/lib/category-seo";
import { guides } from "@/lib/guides";
import { getCategoryVisual, getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BadgeCheck, BookOpen, MapPin, Star } from "lucide-react";
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

  const matches = businesses.filter((business) => business.category === slug);
  const relatedGuides = guides.filter((guide) => seo.guides.includes(guide.slug));
  const visual = getCategoryVisual(slug);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seo.h1,
    itemListElement: matches.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: "https://khonenama.ir/business/" + business.slug,
      name: business.name,
    })),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page category-page">
        <div className="shell">
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

          {relatedGuides.length > 0 && (
            <section className="category-results">
              <div className="section-heading compact-heading">
                <div>
                  <span className="section-kicker">قبل از خرید بخوانید</span>
                  <h2>راهنماهای مرتبط</h2>
                </div>
              </div>

              <div className="category-guide-grid">
                {relatedGuides.slice(0, 6).map((guide) => (
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
