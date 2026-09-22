import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getGuide, guides } from "@/lib/guides";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, Clock3, Link2 } from "lucide-react";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const visual = getGuideVisual(guide.category);

  return {
    title: guide.title,
    description: guide.excerpt,
    keywords: guide.keywords,
    authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
    alternates: { canonical: "/magazine/" + guide.slug },
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      url: "https://khonenama.ir/magazine/" + guide.slug,
      type: "article",
      locale: "fa_IR",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.modifiedAt || guide.publishedAt,
      authors: ["https://khonenama.ir/about"],
      images: [{ url: visual.src, alt: visual.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.excerpt,
      images: [visual.src],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const visual = getGuideVisual(guide.category);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    dateModified: guide.modifiedAt || guide.publishedAt || "2026-09-19",
    datePublished: guide.publishedAt || "2026-09-19",
    inLanguage: "fa-IR",
    mainEntityOfPage: "https://khonenama.ir/magazine/" + guide.slug,
    author: { "@id": "https://khonenama.ir/#organization" },
    publisher: { "@id": "https://khonenama.ir/#organization" },
    keywords: guide.keywords.join(", "),
    articleSection: guide.category,
    abstract: guide.quickAnswer || guide.excerpt,
    about: guide.keywords.slice(0, 6).map((name) => ({ "@type": "Thing", name })),
    citation: guide.sources?.map((source) => source.url),
    isAccessibleForFree: true,
    isPartOf: { "@id": "https://khonenama.ir/#website" },
    image: [visual.src],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir" },
      { "@type": "ListItem", position: 2, name: "مجله", item: "https://khonenama.ir/magazine" },
      { "@type": "ListItem", position: 3, name: guide.title, item: "https://khonenama.ir/magazine/" + guide.slug },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <article className="inner-page guide-page">
        <div className="shell guide-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a>
            <span>/</span>
            <a href="/magazine">مجله</a>
            <span>/</span>
            <span>{guide.category}</span>
          </nav>

          <header className="guide-header">
            <span className="section-kicker">{guide.category}</span>
            <h1>{guide.title}</h1>
            <p>{guide.excerpt}</p>
            <div className="guide-meta">
              <span><Clock3 size={14} /> {guide.readTime}</span>
              <span>به‌روزرسانی: {guide.updated}</span>
            </div>
          </header>

          {guide.quickAnswer && (
            <section className="guide-quick-answer glass-panel" aria-label="پاسخ کوتاه">
              <span className="section-kicker">پاسخ کوتاه</span>
              <p>{guide.quickAnswer}</p>
            </section>
          )}

          <figure className="guide-hero-image">
            <img src={visual.src} alt={visual.alt} />
            <figcaption>تصویر نمونه برای درک بهتر موضوع؛ منبع تصویری دارای مجوز انتشار.</figcaption>
          </figure>

          <div className="guide-layout">
            <div className="guide-content">
              {guide.sections.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets && (
                    <ul>
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  )}
                </section>
              ))}

              <section className="guide-faq">
                <h2>سوالات متداول</h2>
                {guide.faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </section>

              {guide.sources && guide.sources.length > 0 && (
                <section className="guide-sources" aria-label="منابع">
                  <h2>منابع و مراجع</h2>
                  <p>برای بخش‌های فنی و ترندهای این راهنما از منابع اصلی و تخصصی زیر استفاده شده است.</p>
                  <ul>
                    {guide.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="guide-side">
              <div className="guide-side-card glass-panel">
                <span className="section-kicker">مسیر بعدی</span>
                <h3>فروشگاه‌ها و متخصصان مرتبط را ببین</h3>
                <p>بعد از شناخت گزینه‌ها، کسب‌وکارهای مرتبط را در خونه‌نما مقایسه کن.</p>
                <a href={guide.relatedCategory || "/search"}>
                  مشاهده کسب‌وکارها <ArrowUpLeft size={15} />
                </a>
              </div>

              <div className="guide-side-card glass-panel">
                <Link2 size={18} />
                <h3>راهنماهای مرتبط</h3>
                {guides
                  .filter((item) => item.slug !== guide.slug && item.category === guide.category)
                  .slice(0, 3)
                  .map((item) => (
                    <a className="guide-related-link" href={"/magazine/" + item.slug} key={item.slug}>
                      {item.title}
                    </a>
                  ))}
              </div>
            </aside>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
