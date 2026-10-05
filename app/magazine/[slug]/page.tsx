import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreferredSourceCTA from "@/components/PreferredSourceCTA";
import { getGuide, guides, type Guide } from "@/lib/guides";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, Calculator, Clock3, Link2 } from "lucide-react";
import { notFound } from "next/navigation";

const CURTAIN_INSTALLATION_SLUG = "curtain-installation-guide";
const CURTAIN_INSTALLATION_MODIFIED_AT = "2026-09-23";
const SHEET_WALLCOVERING_GUIDES = new Set([
  "marble-sheet-wallpanel-guide", "thermowall-guide", "pvc-mdf-wallpanel-guide", "wall-mural-guide",
]);

const SEO_METADATA_OVERRIDES: Record<string, { title?: string; description?: string }> = {
  "flooring-karaj-guide": { title: "پارکت و لمینت کرج | خرید، نصب و هزینه" },
  "curtain-cleaning-guide": { title: "تمیز کردن پرده زبرا و شید | راهنمای نظافت" },
  "carpet-karaj-guide": { title: "موکت کرج | خرید، متراژ و نصب" },
  "interior-design-karaj-cost-guide": { title: "هزینه طراحی داخلی در کرج | روش قیمت‌گذاری" },
  "curtain-buying-guide": { title: "راهنمای انتخاب پرده منزل | مدل، اندازه و نصب" },
  "wallpaper-vs-wallpanel": {
    description: "کاغذ دیواری و دیوارپوش چسبی، فومی، چوبی و سنگی را از نظر جنس، زیرکار، اتصال، نگهداری و هزینه اجرا مقایسه کنید؛ نکات انتخاب تی‌وی وال را بخوانید.",
  },
  "smart-home-guide": { title: "خانه هوشمند چیست؟ | راهنمای شروع" },
  "carpet-buying-guide": { title: "راهنمای خرید موکت | مشخصات مهم قبل از سفارش" },
  "parquet-vs-laminate": { title: "پارکت یا لمینت؟ | تفاوت و راهنمای انتخاب" },
  "choose-interior-designer": { title: "انتخاب طراح داخلی | ۷ معیار قبل از قرارداد" },
  "wallpaper-karaj-guide": { title: "کاغذ دیواری کرج | خرید، نصب و محاسبه رول" },
  "washable-wallpaper-guide": { title: "کاغذ دیواری قابل شست‌وشو | راهنمای انتخاب" },
  "zebra-curtain-price-guide": {
    title: "قیمت پرده زبرا و انتخاب اقتصادی | چک‌لیست استعلام",
    description: "برای خرید پرده زبرا ارزان، پیشنهادها را با ابعاد، رده پارچه، مکانیزم، یراق، حمل و نصب یکسان مقایسه کنید؛ چک‌لیست استعلام و نکات ضمانت را بخوانید.",
  },
  "laminate-vs-pvc": {
    description: "لمینت و کفپوش PVC را از نظر رطوبت، ظاهر، نصب، دوام و نگهداری مقایسه کنید تا برای فضای خانه انتخاب دقیق‌تری داشته باشید.",
  },
  "smart-home-interior-design-planning-guide": {
    title: "طراحی داخلی و خانه هوشمند | تصمیم‌های قبل از اجرا",
    description: "برق، شبکه، پرده، نور، سنسورها و دسترسی سرویس را پیش از اجرای سقف و کابینت هماهنگ کنید تا دوباره‌کاری پروژه کمتر شود.",
  },
  "best-curtain-living-room": { title: "بهترین پرده برای پذیرایی | انتخاب بر اساس نور" },
  "carpet-bedroom-guide": { title: "موکت اتاق خواب و کودک | پرز، نظافت و صدا" },
  "smart-home-rental-apartment-guide": { title: "خانه هوشمند برای مستأجرها | بدون تخریب" },
  "smart-home-without-internet-guide": {
    title: "با قطع اینترنت خانه هوشمند چه اتفاقی می‌افتد؟ | کنترل محلی",
    description: "با قطع اینترنت خانه هوشمند چه اتفاقی می‌افتد؟ عملکرد کنترل محلی، شبکه داخلی، کلید فیزیکی، Matter و سرویس‌های Cloud را قبل از خرید و اجرا بررسی کنید.",
  },
  "matter-controller-thread-border-router-guide": { title: "Matter Controller یا Thread Border Router؟" },
  "knx-vs-matter-smart-home-guide": { title: "KNX یا Matter؟ | تفاوت و کاربرد در خانه هوشمند" },
  "presence-vs-motion-sensor-smart-home-guide": { title: "سنسور حضور یا حرکت؟ | Presence و Motion" },
  "smart-lock-buying-security-guide": { title: "راهنمای خرید قفل هوشمند | امنیت و Matter" },
  "matter-thread-zigbee-wifi-guide-2026": { title: "Matter، Thread، Zigbee یا Wi‑Fi؟" },
  "interior-decoration-budget-priority-guide": { title: "بودجه دکوراسیون داخلی | اولویت هزینه‌ها" },
  "pantone-cloud-dancer-2026-interior-guide": { title: "رنگ سال ۲۰۲۶ Pantone | Cloud Dancer در دکوراسیون" },
  "biophilic-interior-design-guide-2026": { title: "طراحی بیوفیلیک در خانه | راهنمای کاربردی" },
  "smart-home-karaj-cost-guide": { title: "هزینه خانه هوشمند در کرج | عوامل قیمت" },
  "smart-lighting-scenes-guide-2026": {
    title: "نور و روشنایی هوشمند | کلید، دیمر، سنسور و سناریو",
    description: "راهنمای نور و روشنایی هوشمند خانه؛ کلید و دیمر هوشمند، سنسور، زون‌بندی، کنترل محلی و سناریوهای واقعی روشنایی را بررسی کنید.",
  },
  "small-apartment-interior-design-guide": { title: "طراحی داخلی خانه کوچک | ۱۲ اصل کاربردی" },
  "smart-home-security-guide-2026": { title: "امنیت خانه هوشمند | ۹ اقدام ضروری" },
  "living-room-zoning-lighting-guide": { title: "چیدمان پذیرایی | زون‌بندی و نورپردازی" },
  "interior-design-trends-2026": { title: "ترندهای طراحی داخلی ۲۰۲۶ | رنگ، بافت و فناوری" },
};

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

const RELATED_STOP_WORDS = new Set(["برای", "راهنمای", "چیست", "کدام", "بهتر", "است", "یا", "و", "در", "از", "با", "چه", "یک", "انواع", "نکات", "انتخاب"]);

function guideTopicTerms(guide: Guide) {
  const raw = [guide.title, ...guide.keywords].join(" ").replace(/[؟،؛:()|/\-]/g, " ");
  return new Set(raw.split(/\s+/).map((item) => item.trim()).filter((item) => item.length > 2 && !RELATED_STOP_WORDS.has(item)));
}

function getRelatedGuides(guide: Guide) {
  const curtainPaths: Record<string, string[]> = {
    "zebra-curtain-guide": ["zebra-curtain-price-guide", "curtain-installation-guide", "shade-curtain-guide", "zebra-vs-shade"],
    "shade-curtain-guide": ["curtain-installation-guide", "zebra-vs-shade", "blackout-curtain-guide", "curtain-cleaning-guide"],
    "curtain-installation-guide": ["zebra-curtain-guide", "shade-curtain-guide", "zebra-curtain-price-guide", "curtain-cleaning-guide"],
    "zebra-curtain-price-guide": ["zebra-curtain-guide", "curtain-installation-guide", "shade-curtain-guide", "curtain-buying-guide"],
    "curtain-cleaning-guide": ["curtain-installation-guide", "zebra-curtain-guide", "shade-curtain-guide", "curtain-buying-guide"],
    "zebra-vs-shade": ["shade-curtain-guide", "zebra-curtain-guide", "curtain-installation-guide", "zebra-curtain-price-guide"],
  };
  const selectedPaths = guide.relatedGuideSlugs || curtainPaths[guide.slug];
  if (selectedPaths) {
    return selectedPaths.map(getGuide).filter((item): item is Guide => Boolean(item));
  }
  const currentTerms = guideTopicTerms(guide);
  return guides
    .filter((item) => item.slug !== guide.slug)
    .map((item) => {
      const itemTerms = guideTopicTerms(item);
      let overlap = 0;
      currentTerms.forEach((term) => { if (itemTerms.has(term)) overlap += 1; });
      const score = (item.category === guide.category ? 6 : 0) + overlap * 3 + (item.relatedCategory === guide.relatedCategory ? 1 : 0);
      return { item, score, overlap };
    })
    .filter(({ item, overlap }) => item.category === guide.category || overlap > 0)
    .sort((a, b) => b.score - a.score || b.overlap - a.overlap || a.item.title.localeCompare(b.item.title, "fa"))
    .slice(0, 4)
    .map(({ item }) => item);
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const visual = getGuideVisual(guide.category, guide.slug);
  const isCurtainInstallation = guide.slug === CURTAIN_INSTALLATION_SLUG;
  const modifiedAt = isCurtainInstallation
    ? guide.modifiedAt || CURTAIN_INSTALLATION_MODIFIED_AT
    : guide.modifiedAt || guide.publishedAt;
  const seoOverride = SEO_METADATA_OVERRIDES[guide.slug];
  const metadataTitle = seoOverride?.title || guide.title;
  const metadataDescription = seoOverride?.description || guide.excerpt;

  return {
    title: metadataTitle,
    description: metadataDescription,
    keywords: enhancedKeywords(guide.slug, guide.keywords),
    authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
    alternates: { canonical: "/magazine/" + guide.slug },
    openGraph: {
      title: metadataTitle,
      description: metadataDescription,
      url: "https://khonenama.ir/magazine/" + guide.slug,
      type: "article",
      locale: "fa_IR",
      publishedTime: guide.publishedAt,
      modifiedTime: modifiedAt,
      authors: ["https://khonenama.ir/about"],
      images: [{ url: visual.src, alt: visual.alt, width: visual.width, height: visual.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description: metadataDescription,
      images: [visual.src],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const visual = getGuideVisual(guide.category, guide.slug);
  const isCurtainInstallation = guide.slug === CURTAIN_INSTALLATION_SLUG;
  const modifiedAt = isCurtainInstallation
    ? guide.modifiedAt || CURTAIN_INSTALLATION_MODIFIED_AT
    : guide.modifiedAt || guide.publishedAt || "2026-09-19";
  const fallbackQuickAnswer = [guide.sections[0]?.paragraphs?.[0], guide.sections[1]?.paragraphs?.[0]]
    .filter(Boolean)
    .join(" ");
  const quickAnswer = isCurtainInstallation
    ? "برای نصب پرده دیواری، پایه‌ها روی دیوار بالای قاب یا در محل مناسب اطراف پنجره بسته می‌شوند؛ برای نصب سقفی، پایه به سقف متصل می‌شود. انتخاب بین این دو به جنس سطح، فضای بازشو، عرض پوشش موردنیاز و مسیر تأسیسات بستگی دارد. قبل از سفارش زبرا یا شید، محل نصب را مشخص و عرض و ارتفاع را بر همان مبنا اندازه‌گیری کنید."
    : guide.quickAnswer || fallbackQuickAnswer || guide.excerpt;
  const relatedGuides = getRelatedGuides(guide);
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
    publishingPrinciples: "https://khonenama.ir/editorial-policy",
    keywords: enhancedKeywords(guide.slug, guide.keywords).join(", "),
    articleSection: guide.category,
    abstract: quickAnswer || guide.excerpt,
    about: enhancedKeywords(guide.slug, guide.keywords).slice(0, 8).map((name) => ({ "@type": "Thing", name })),
    citation: guide.sources?.map((source) => source.url),
    isAccessibleForFree: true,
    isPartOf: { "@id": "https://khonenama.ir/#website" },
    image: {
      "@type": "ImageObject",
      url: visual.src,
      width: visual.width,
      height: visual.height,
      caption: visual.alt,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خونه نما", item: "https://khonenama.ir" },
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
            <a href="/">خونه نما</a>
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
              <a href="/about">درباره خونه نما</a>
              <a href="/editorial-policy">سیاست تحریریه</a>
            </div>
          </header>

          {quickAnswer && (
            <section className="guide-quick-answer glass-panel" aria-label="پاسخ کوتاه">
              <span className="section-kicker">پاسخ کوتاه</span>
              <p>{quickAnswer}</p>
            </section>
          )}

          <figure className="guide-hero-image">
            <img
              src={visual.src}
              alt={visual.alt}
              width={visual.width}
              height={visual.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <figcaption>{visual.alt}؛ تصویر مرتبط برای درک بهتر موضوع و دارای مجوز انتشار.</figcaption>
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
                  <p>
                    برای بررسی <a href="/magazine/zebra-curtain-guide">مزایا و معایب پرده زبرا</a>، راهنمای انتخاب مدل را بخوانید؛ برای <a href="/magazine/zebra-curtain-price-guide">مقایسه قیمت زبرا و هزینه نصب</a>، مشخصات پیشنهاد فروشنده را جداگانه بررسی کنید.
                  </p>
                </section>
              )}

              {guide.slug === "zebra-curtain-price-guide" && (
                <section>
                  <h2>استعلام قیمت پرده زبرا در کرج</h2>
                  <p>برای بررسی فروشگاه‌ها و خدمات محلی، به صفحه <a href="/karaj/curtain">پرده در کرج</a> بروید و مشخصات یکسان را برای استعلام آماده کنید. قیمت نهایی، موجودی و زمان تحویل باید مستقیماً با فروشنده تأیید شوند.</p>
                </section>
              )}

              {guide.sections.map((section) => {
                const visibleParagraphs = section.paragraphs.slice(0, 2);
                const extraParagraphs = section.paragraphs.slice(2);
                const hasExtraDetails = extraParagraphs.length > 0 || Boolean(section.bullets?.length);

                return (
                  <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    {visibleParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {hasExtraDetails && (
                      <details className="guide-detail-accordion">
                        <summary>توضیح کامل‌تر و نکات فنی</summary>
                        <div className="guide-detail-accordion-body">
                          {extraParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                          {section.bullets && (
                            <ul>
                              {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                            </ul>
                          )}
                        </div>
                      </details>
                    )}
                  </section>
                );
              })}

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
              {guide.category === "کاغذ دیواری" && !SHEET_WALLCOVERING_GUIDES.has(guide.slug) && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>تعداد رول را محاسبه کن</h3>
                  <p>عرض و ارتفاع دیوار، ابعاد رول و Pattern Repeat را وارد کن تا تعداد رول لازم مشخص شود.</p>
                  <a href="/tools/wallpaper-calculator">
                    محاسبه‌گر کاغذ دیواری <ArrowUpLeft size={15} />
                  </a>
                </div>
              )}

              {SHEET_WALLCOVERING_GUIDES.has(guide.slug) && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>ابعاد و نقشه برش دیوارپوش را آماده کنید</h3>
                  <p>عرض و ارتفاع دیوار، اندازه و پوشش مؤثر پنل، جهت طرح و بازشوها را با مجری تأیید کنید؛ محاسبه تعداد رول کاغذ دیواری برای ورق، پنل یا پوستر سفارشی مناسب نیست.</p>
                  <a href="/category/wallpaper#businesses">فروشندگان و مجریان دیوارپوش <ArrowUpLeft size={15} /></a>
                </div>
              )}

              {guide.category === "پرده" && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>متراژ پارچه پرده را حساب کن</h3>
                  <p>برای پرده پارچه‌ای، عرض ریل، قد، ضریب جمع و تکرار طرح را وارد کنید. این ابزار ابعاد سفارش زبرا یا شید رول را تعیین نمی‌کند.</p>
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

              {guide.category === "کفپوش" && (
                <div className="guide-side-card guide-tool-link glass-panel">
                  <Calculator size={18} />
                  <h3>متراژ کفپوش و تعداد بسته را حساب کن</h3>
                  <p>ابعاد فضا، پوشش هر بسته و پرت را وارد کن؛ برای کفپوش رولی، عرض رول و جهت برش را هم بررسی کن.</p>
                  <a href="/tools/flooring-estimator">
                    محاسبه‌گر پارکت، لمینت و کفپوش <ArrowUpLeft size={15} />
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
                <p>بعد از شناخت گزینه‌ها، خدمات و محدوده فعالیت غرفه واقعی را بررسی کنید و با مشخصات یکسان استعلام بگیرید.</p>
                <a href={guide.relatedCategory ? guide.relatedCategory + "#businesses" : "/search"}>
                  مشاهده کسب‌وکارها <ArrowUpLeft size={15} />
                </a>
                <a href="/help#compare-quotes">چک‌لیست مقایسه قیمت و هزینه‌های جانبی</a>
                <a href="/help#handover-checklist">نکات بررسی و تحویل کار</a>
              </div>

              <PreferredSourceCTA compact />

              <div className="guide-side-card glass-panel">
                <span className="section-kicker">شفافیت تحریریه</span>
                <h3>این راهنما چطور تهیه می‌شود؟</h3>
                <p>روش نگارش، استفاده از منابع، به‌روزرسانی محتوا و سیاست خونه نما درباره داده‌های واقعی را ببینید.</p>
                <a href="/editorial-policy">مشاهده سیاست تحریریه <ArrowUpLeft size={15} /></a>
              </div>

              <div className="guide-side-card glass-panel">
                <Link2 size={18} />
                <h3>راهنماهای مرتبط</h3>
                {relatedGuides.map((item) => (
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
