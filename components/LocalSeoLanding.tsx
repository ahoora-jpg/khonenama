import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAiSearchContent } from "@/lib/ai-search-content";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { getLocalVisual } from "@/lib/visuals";
import { ArrowUpLeft, BadgeCheck, BriefcaseBusiness, Crown, MapPin, Star } from "lucide-react";

type Faq = { question: string; answer: string };
type GuideLink = { title: string; text: string; href: string };
type SearchIntent = { title: string; text: string; href: string };

const localSearchIntents: Record<string, SearchIntent[]> = {
  curtain: [
    {
      title: "نصب پرده در کرج",
      text: "برای نصب دیواری یا سقفی، قبل از سفارش محل پایه، جنس سطح، عرض پوشش و دسترسی به پنجره را مشخص کنید.",
      href: "/magazine/curtain-installation-guide",
    },
    {
      title: "پرده زبرا کرج",
      text: "زبرا را بر اساس کنترل نور، نوع مکانیزم، کیفیت پارچه، ابعاد پنجره و خدمات اندازه‌گیری و نصب مقایسه کنید.",
      href: "/magazine/zebra-curtain-guide",
    },
    {
      title: "پرده شید کرج",
      text: "شید ساده، اسکرین و بلک‌اوت کاربرد یکسانی ندارند؛ میزان نور، حریم خصوصی و نوع اتاق را در انتخاب لحاظ کنید.",
      href: "/magazine/shade-curtain-guide",
    },
    {
      title: "پرده فروشی کرج",
      text: "فروشگاه را فقط بر اساس نزدیکی انتخاب نکنید؛ تنوع واقعی، اندازه‌گیری، نصب و شرایط خدمات پس از فروش را هم بررسی کنید.",
      href: "/category/curtain",
    },
  ],
  flooring: [
    {
      title: "پارکت لمینت کرج",
      text: "پارکت چوبی و لمینت از نظر جنس، نصب، مقاومت به رطوبت و نگهداری متفاوت‌اند؛ قبل از خرید تفاوت آن‌ها را روشن کنید.",
      href: "/magazine/parquet-vs-laminate",
    },
    {
      title: "نصب پارکت و کفپوش در کرج",
      text: "کیفیت زیرسازی، تراز سطح، قرنیز و روش نصب روی نتیجه نهایی اثر مستقیم دارد؛ فقط قیمت هر متر را مقایسه نکنید.",
      href: "/category/flooring",
    },
    {
      title: "کفپوش PVC کرج",
      text: "برای PVC، نوع کاربری، وضعیت زیرسازی، ضخامت و مقاومت سطح در برابر سایش و رطوبت را کنار هم بررسی کنید.",
      href: "/category/flooring",
    },
    {
      title: "فروش پارکت در کرج",
      text: "موجودی واقعی، کلاس سایش، برند، متعلقات، هزینه نصب و شرایط تحویل را از فروشنده به‌صورت شفاف بپرسید.",
      href: "/category/flooring",
    },
  ],
  carpet: [
    {
      title: "موکت کرج",
      text: "جنس الیاف، تراکم، ارتفاع پرز و نظافت‌پذیری را متناسب با اتاق خواب، کودک یا فضای پرتردد مقایسه کنید.",
      href: "/category/carpet",
    },
    {
      title: "نصب موکت در کرج",
      text: "پرت برش، جهت خواب، چسب یا زیرسازی و فرم اتاق می‌تواند مصرف و کیفیت اجرای موکت را تغییر دهد.",
      href: "/category/carpet",
    },
    {
      title: "موکت تایلی کرج",
      text: "موکت تایلی برای تعویض موضعی و فضاهای پرتردد مزیت دارد؛ موکت رول برای پوشش یکپارچه انتخاب رایج‌تری است.",
      href: "/magazine/carpet-types-guide",
    },
    {
      title: "فروشگاه موکت کرج",
      text: "تنوع نمونه، موجودی، عرض رول، تعداد تایل در بسته و خدمات اندازه‌گیری و نصب را قبل از انتخاب فروشگاه بررسی کنید.",
      href: "/category/carpet",
    },
  ],
  wallpaper: [
    {
      title: "نصب کاغذ دیواری در کرج",
      text: "کیفیت نصب به آماده‌سازی سطح وابسته است؛ نم، ترک، ناهمواری و نوع چسب باید قبل از اجرا بررسی شوند.",
      href: "/magazine/wallpaper-guide",
    },
    {
      title: "نصاب کاغذ دیواری کرج",
      text: "برای مقایسه نصاب‌ها، تجربه روی جنس انتخابی، روش زیرسازی، درزها، پرت رول و مسئولیت اصلاح ایراد را بپرسید.",
      href: "/karaj/wallpaper",
    },
    {
      title: "فروشگاه کاغذ دیواری کرج",
      text: "تنوع واقعی طرح و جنس، ابعاد رول، تکرار طرح، موجودی و امکان تأمین رول هم‌سری را قبل از خرید مقایسه کنید.",
      href: "/category/wallpaper",
    },
    {
      title: "کاغذ دیواری قابل شستشو کرج",
      text: "قابل شستشو بودن درجات مختلف دارد و به معنی مناسب بودن برای دیوار نم‌دار نیست؛ مشخصات همان محصول را بررسی کنید.",
      href: "/magazine/wallpaper-guide",
    },
  ],
  "interior-design": [
    {
      title: "دکوراسیون داخلی کرج",
      text: "دامنه خدمات، نمونه پروژه مرتبط، مسئولیت طراحی و اجرا، زمان‌بندی و شیوه مدیریت تغییرات را قبل از قرارداد مقایسه کنید.",
      href: "/category/interior-design",
    },
    {
      title: "طراحی داخلی کرج",
      text: "قبل از انتخاب طراح، متراژ، سبک زندگی، محدودیت‌های فضا، بودجه و سطح خروجی مورد انتظار را مشخص کنید.",
      href: "/category/interior-design",
    },
    {
      title: "اجرای دکوراسیون داخلی در کرج",
      text: "در قرارداد اجرا باید محدوده کار، متریال، مسئول خرید، زمان‌بندی، تغییرات و نحوه تحویل نهایی روشن باشد.",
      href: "/category/interior-design",
    },
    {
      title: "بهترین طراح دکوراسیون داخلی کرج",
      text: "یک گزینه واحد برای همه بهترین نیست؛ تخصص مرتبط، فرآیند کاری، نمونه پروژه واقعی و شفافیت قرارداد را مقایسه کنید.",
      href: "/karaj/interior-design",
    },
  ],
  "smart-home": [
    {
      title: "خانه هوشمند کرج",
      text: "روشنایی، پرده، امنیت، دما، قفل و سنسورها را بر اساس نیاز واقعی و امکان کنترل محلی یا ابری دسته‌بندی کنید.",
      href: "/category/smart-home",
    },
    {
      title: "هوشمندسازی ساختمان کرج",
      text: "برای ساختمان آماده، نوساز یا بازسازی مسیر اجرا متفاوت است؛ ابتدا Scope تجهیزات و محدودیت سیم‌کشی را مشخص کنید.",
      href: "/magazine/smart-home-guide",
    },
    {
      title: "شرکت خانه هوشمند کرج",
      text: "مجری را بر اساس معماری سیستم، پشتیبانی، مستندسازی، قابلیت کارکرد بدون اینترنت و سازگاری تجهیزات مقایسه کنید.",
      href: "/karaj/smart-home",
    },
    {
      title: "پرده برقی و روشنایی هوشمند کرج",
      text: "سناریوی مناسب باید جهت پنجره، نور روز، حریم خصوصی و روشنایی مصنوعی را با هم در نظر بگیرد.",
      href: "/magazine/smart-curtain-daylight-guide",
    },
  ],
};

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
  const competitiveIntents = localSearchIntents[categorySlug] || [];
  const localUrl = "https://khonenama.ir/karaj/" + categorySlug;
  const visual = getLocalVisual(categorySlug);

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
    primaryImageOfPage: {
      "@type": "ImageObject",
      contentUrl: visual.src,
      caption: visual.alt,
      width: visual.width,
      height: visual.height,
    },
    image: visual.src,
    about: [
      { "@type": "Thing", name: h1 },
      { "@type": "Place", name: "کرج" },
      ...competitiveIntents.map((item) => ({ "@type": "Thing", name: item.title })),
      ...guides.slice(0, 6).map((guide) => ({ "@type": "Thing", name: guide.title })),
      ...aiAnswers.map((item) => ({ "@type": "Thing", name: item.question })),
    ],
    hasPart: [
      {
        "@type": "CollectionPage",
        name: "راهنمای جامع " + h1.replace(" در کرج", ""),
        url: "https://khonenama.ir/category/" + categorySlug,
      },
      ...competitiveIntents.map((item) => ({
        "@type": "WebPage",
        name: item.title,
        url: item.href.startsWith("http") ? item.href : "https://khonenama.ir" + item.href,
      })),
      ...guides.slice(0, 6).map((guide) => ({
        "@type": "WebPage",
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

          <div className="category-hero category-hero-with-media glass-panel">
            <div>
              <span className="section-kicker">راهنمای محلی خونه‌نما</span>
              <h1>{h1}</h1>
              <p>{intro}</p>
              <a href={"/category/" + categorySlug}>راهنمای جامع این دسته</a>
              <a href="/editorial-policy">روش تدوین و بررسی اطلاعات خونه‌نما</a>
            </div>
            <img
              src={visual.src}
              alt={visual.alt}
              width={visual.width}
              height={visual.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <section className="local-intent-grid">
            {intentCards.map((item) => (
              <div className="local-intent-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            ))}
          </section>

          {competitiveIntents.length > 0 && (
            <section className="category-results" aria-labelledby="local-search-intents-heading">
              <div className="section-heading compact-heading">
                <div>
                  <span className="section-kicker">مسیرهای رایج جستجو در کرج</span>
                  <h2 id="local-search-intents-heading">برای این نیازها از کجا شروع کنیم؟</h2>
                </div>
                <p>عبارت‌های رایج جستجو را به راهنما و صفحه مرتبط وصل کرده‌ایم تا قبل از تماس، مسئله دقیق‌تر مشخص شود.</p>
              </div>
              <div className="category-guide-grid">
                {competitiveIntents.map((item) => (
                  <a className="category-guide-card" href={item.href} key={item.title}>
                    <div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpLeft size={16} />
                  </a>
                ))}
              </div>
            </section>
          )}

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
