import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getGuide, guides } from "@/lib/guides";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, Calculator, Clock3, Link2 } from "lucide-react";
import { notFound } from "next/navigation";

const CURTAIN_INSTALLATION_SLUG = "curtain-installation-guide";
const CURTAIN_INSTALLATION_MODIFIED_AT = "2026-09-23";

const curtainInstallationExtraFaqs = [
  {
    question: "نصب پرده دیواری چه زمانی مناسب‌تر است؟",
    answer:
      "وقتی سقف برای پیچ‌کاری مناسب نیست، سقف کاذب محدودیت دارد یا می‌خواهید پایه‌ها روی دیوار بالای قاب قرار بگیرند، نصب دیواری می‌تواند گزینه مناسب‌تری باشد. قبل از سوراخ‌کاری باید مسیر تأسیسات و فضای بازشدن پنجره بررسی شود.",
  },
  {
    question: "برای پرده زبرا نصب سقفی بهتر است یا دیواری؟",
    answer:
      "هیچ روش واحدی برای همه پنجره‌ها بهتر نیست. نصب سقفی معمولاً ظاهر یکپارچه‌تری می‌دهد و نصب دیواری در بعضی قاب‌ها یا سقف‌های نامناسب عملی‌تر است؛ اندازه‌گیری و جنس سطح نصب تعیین‌کننده‌اند.",
  },
];

function enhancedKeywords(slug: string, keywords: string[]) {
  if (slug !== CURTAIN_INSTALLATION_SLUG) return keywords;
  return [
    ...keywords,
    "نصب پرده دیواری",
    "نصب پرده سقفی",
    "انتخاب محل نصب پرده",
    "اندازه گیری پرده",
  ];
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const visual = getGuideVisual(guide.category);
  const isCurtainInstallation = guide.slug === CURTAIN_INSTALLATION_SLUG;
  const modifiedAt = isCurtainInstallation
    ? CURTAIN_INSTALLATION_MODIFIED_AT
    : guide.modifiedAt || guide.publishedAt;

  return {
    title: guide.title,
    description: guide.excerpt,
    keywords: enhancedKeywords(guide.slug, guide.keywords),
    authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
    alternates: { canonical: "/magazine/" + guide.slug },
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      url: "https://khonenama.ir/magazine/" + guide.slug,
      type: "article",
      locale: "fa_IR",
      publishedTime: guide.publishedAt,
      modifiedTime: modifiedAt,
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
  const isCurtainInstallation = guide.slug === CURTAIN_INSTALLATION_SLUG;
  const modifiedAt = isCurtainInstallation
    ? CURTAIN_INSTALLATION_MODIFIED_AT
    : guide.modifiedAt || guide.publishedAt || "2026-09-19";
  const quickAnswer = isCurtainInstallation
    ? "برای نصب پرده دیواری، پایه‌ها روی دیوار بالای قاب یا در محل مناسب اطراف پنجره بسته می‌شوند؛ برای نصب سقفی، پایه به سقف متصل می‌شود. انتخاب بین این دو به جنس سطح، فضای بازشو، عرض پوشش موردنیاز و مسیر تأسیسات بستگی دارد. قبل از سفارش زبرا یا شید، محل نصب را مشخص و عرض و ارتفاع را بر همان مبنا اندازه‌گیری کنید."
    : guide.quickAnswer;
  const visibleFaqs = isCurtainInstallation
    ? [...guide.faqs, ...curtainInstallationExtraFaqs]
    : guide.faqs;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    dateModified: modifiedAt,
    datePublished: guide.publishedAt || "2026-09-19",
    inLanguage: "fa-IR",
    mainEntityOfPage: "https://khonenama.ir/magazine/" + guide.slug,
    author: { "@id": "https://khonenama.ir/#organization" },
    publisher: { "@id": "https://khonenama.ir/#organization" },
    keywords: enhancedKeywords(guide.slug, guide.keywords).join(", "),
    articleSection: guide.category,
    abstract: quickAnswer || guide.excerpt,
    about: enhancedKeywords(guide.slug, guide.keywords).slice(0, 8).map((name) => ({ "@type": "Thing", name })),
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
    mainEntity: visibleFaqs.map((faq) => ({
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
              <span>به‌روزرسانی: {isCurtainInstallation ? "۱۴۰۵/۰۷/۰۱" : guide.updated}</span>
            </div>
          </header>

          {quickAnswer && (
            <section className="guide-quick-answer glass-panel" aria-label="پاسخ کوتاه">
              <span className="section-kicker">پاسخ کوتاه</span>
              <p>{quickAnswer}</p>
            </section>
          )}

          <figure className="guide-hero-image">
            <img src={visual.src} alt={visual.alt} />
            <figcaption>تصویر نمونه برای درک بهتر موضوع؛ منبع تصویری دارای مجوز انتشار.</figcaption>
          </figure>

          <div className="guide-layout">
            <div className="guide-content">
              {isCurtainInstallation && (
                <section>
                  <h2>نصب پرده دیواری یا سقفی؛ کدام محل برای پنجره شما مناسب‌تر است؟</h2>
                  <p>
                    در نصب پرده دیواری، پایه‌ها روی دیوار و معمولاً بالاتر از قاب پنجره قرار می‌گیرند؛ در نصب سقفی، پایه مستقیماً به سقف یا سطح بالایی مناسب متصل می‌شود. برای زبرا و شید، تصمیم محل نصب باید قبل از اندازه‌گیری نهایی گرفته شود چون عرض پوشش، ارتفاع پرده و فاصله از دستگیره یا بازشوی پنجره را تغییر می‌دهد.
                  </p>
                  <p>
                    اگر سقف کاذب، مسیر برق یا سطح نامناسب دارید، نصب دیواری می‌تواند عملی‌تر باشد. اگر هدف پوشش یکپارچه‌تر و افزایش ارتفاع بصری است، نصب سقفی ارزش بررسی دارد. در هر دو حالت، جنس دیوار یا سقف و پیچ و رول‌پلاک متناسب با آن باید قبل از اجرا مشخص شود.
                  </p>
                </section>
              )}

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
                {visibleFaqs.map((faq) => (
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
              {guide.category === "کاغذ دیواری" && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>تعداد رول را محاسبه کن</h3>
                  <p>عرض و ارتفاع دیوار، ابعاد رول و Pattern Repeat را وارد کن تا تعداد رول لازم مشخص شود.</p>
                  <a href="/tools/wallpaper-calculator">
                    محاسبه‌گر کاغذ دیواری <ArrowUpLeft size={15} />
                  </a>
                </div>
              )}

              {guide.category === "پرده" && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>متراژ پارچه پرده را حساب کن</h3>
                  <p>عرض ریل، قد پرده، Fullness و Pattern Repeat را وارد کن تا متراژ تقریبی پارچه مشخص شود.</p>
                  <a href="/tools/curtain-fabric-calculator">
                    محاسبه‌گر متراژ پرده <ArrowUpLeft size={15} />
                  </a>
                </div>
              )}

              {guide.category === "خانه هوشمند" && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>Scope پروژه را قبل از قیمت‌گیری مشخص کن</h3>
                  <p>تعداد نقاط روشنایی، پرده، دما، امنیت و سنسورها را وارد کن تا محدوده اولیه پروژه مشخص شود.</p>
                  <a href="/tools/smart-home-scope">
                    ابزار Scope خانه هوشمند <ArrowUpLeft size={15} />
                  </a>
                </div>
              )}

              {guide.category === "موکت" && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>متراژ موکت را قبل از خرید حساب کن</h3>
                  <p>برای رول، متراژ طولی و جهت نوارها؛ برای تایلی، تعداد تایل و بسته را با پرت حساب کن.</p>
                  <a href="/tools/carpet-estimator">
                    محاسبه‌گر موکت <ArrowUpLeft size={15} />
                  </a>
                </div>
              )}

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
