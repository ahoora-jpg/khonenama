import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { BadgeCheck, MapPin, Star } from "lucide-react";

const pageUrl = "https://khonenama.ir/karaj/baraghan";
const pageTitle = "دکوراسیون خیابان برغان کرج | فروشگاه‌ها و خدمات";
const pageDescription =
  "فروشگاه‌ها و متخصصان پرده، کفپوش، موکت، کاغذ دیواری و دکوراسیون در خیابان برغان کرج را در خونه‌نما پیدا و مقایسه کنید.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: "خونه‌نما",
    locale: "fa_IR",
    type: "website",
  },
  twitter: { card: "summary", title: pageTitle, description: pageDescription },
};

const localFaqs = [
  {
    question: "برای پیدا کردن فروشگاه دکوراسیون در محدوده برغان کرج چه چیزهایی را مقایسه کنیم؟",
    answer:
      "نوع خدمت، محدوده فعالیت، توضیحات پروفایل، نمونه‌کار واقعی، روش تماس و جزئیات پیشنهاد را کنار هم بررسی کنید. نزدیک بودن مفید است، اما به‌تنهایی معیار کافی برای انتخاب نیست.",
  },
  {
    question: "قبل از تماس با فروشگاه یا مجری چه اطلاعاتی آماده کنیم؟",
    answer:
      "نوع محصول یا خدمت، ابعاد تقریبی، عکس فضا، محدوده پروژه و زمان موردنظر را آماده کنید. برای پرده، موکت، کاغذ دیواری و خانه هوشمند می‌توانید قبل از تماس از ابزارهای محاسبه خونه‌نما استفاده کنید.",
  },
  {
    question: "اگر هنوز کسب‌وکاری در این صفحه نمایش داده نشود یعنی در برغان خدماتی وجود ندارد؟",
    answer:
      "خیر. این صفحه فقط پروفایل‌های واقعی و منتشرشده خونه‌نما را نمایش می‌دهد. نبود نتیجه به معنی نبود کسب‌وکار در محدوده نیست و با انتشار پروفایل‌های واجد شرایط، فهرست به‌روزرسانی می‌شود.",
  },
];

export default async function BaraghanPage() {
  const localBusinesses = await listPublishedBusinesses({
    city: "کرج",
    area: "برغان",
    limit: 50,
  });

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl + "#webpage",
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
    inLanguage: "fa-IR",
    isPartOf: { "@id": "https://khonenama.ir/#website" },
    about: {
      "@type": "Place",
      name: "خیابان برغان، کرج",
      containedInPlace: { "@type": "City", name: "کرج" },
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: localBusinesses.length,
      itemListElement: localBusinesses.map((business, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://khonenama.ir/business/${business.slug}`,
        name: business.name,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir/" },
      { "@type": "ListItem", position: 2, name: "دکوراسیون کرج", item: "https://khonenama.ir/karaj" },
      { "@type": "ListItem", position: 3, name: "خیابان برغان", item: pageUrl },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: localFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <section className="inner-page category-page">
        <div className="shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/karaj">کرج</a><span>/</span><span>خیابان برغان</span>
          </nav>

          <div className="category-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه‌نما</span>
            <h1>دکوراسیون در خیابان برغان کرج</h1>
            <p>
              این صفحه برای پیدا کردن و مقایسه فروشگاه‌ها و متخصصان دکوراسیون محدوده برغان کرج ساخته شده است؛
              از پرده و پارچه تا کفپوش، موکت، کاغذ دیواری، طراحی داخلی و خدمات خانه. فقط پروفایل‌های واقعی و منتشرشده خونه‌نما در فهرست کسب‌وکارها نمایش داده می‌شوند.
            </p>
          </div>

          <section className="category-seo-copy">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">قبل از انتخاب</span>
                <h2>چطور گزینه مناسب را در محدوده برغان پیدا کنیم؟</h2>
              </div>
            </div>
            <div className="category-seo-grid">
              <article>
                <h3>خدمت دقیق را مشخص کنید</h3>
                <p>
                  اول روشن کنید دنبال خرید محصول هستید یا اندازه‌گیری، نصب و اجرا. مثلاً «پرده زبرا با نصب»، «لمینت و زیرسازی» یا «کاغذ دیواری با اجرای کامل» درخواست دقیق‌تری از یک عنوان کلی مثل دکوراسیون است.
                </p>
              </article>
              <article>
                <h3>پیشنهادها را با دامنه یکسان مقایسه کنید</h3>
                <p>
                  وقتی از چند مجموعه استعلام می‌گیرید، مطمئن شوید جنس، مقدار، خدمات نصب، حمل و بخش‌های جانبی در همه پیشنهادها مشخص هستند. قیمت‌هایی که دامنه متفاوت دارند قابل مقایسه مستقیم نیستند.
                </p>
              </article>
              <article>
                <h3>محدوده فعالیت را بررسی کنید</h3>
                <p>
                  بعضی فروشگاه‌ها مراجعه حضوری دارند و بعضی مجریان در چند محله خدمات ارائه می‌کنند. اطلاعات پروفایل و محدوده فعالیت را قبل از تماس بررسی کنید تا گزینه‌های نامرتبط حذف شوند.
                </p>
              </article>
            </div>
          </section>

          <section className="category-seo-copy">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">مسیرهای مرتبط</span>
                <h2>برای تصمیم دقیق‌تر از راهنما و ابزار استفاده کنید</h2>
              </div>
            </div>
            <div className="local-intent-grid">
              <a className="local-intent-card" href="/category/curtain"><h3>پرده و متعلقات</h3><p>زبرا، شید، بلک‌اوت، اندازه‌گیری و نصب را قبل از سفارش مقایسه کنید.</p></a>
              <a className="local-intent-card" href="/category/flooring"><h3>کفپوش و پارکت</h3><p>لمینت، پارکت و PVC را بر اساس زیرسازی، رطوبت و نوع فضا بررسی کنید.</p></a>
              <a className="local-intent-card" href="/category/wallpaper"><h3>کاغذ دیواری</h3><p>جنس، زیرسازی، تکرار طرح و تعداد رول موردنیاز را قبل از خرید مشخص کنید.</p></a>
              <a className="local-intent-card" href="/tools"><h3>ابزارهای محاسبه</h3><p>متراژ پرده، موکت، تعداد رول کاغذ دیواری و Scope اولیه خانه هوشمند را برآورد کنید.</p></a>
            </div>
          </section>

          <div className="category-results">
            <div className="section-heading compact-heading">
              <div><h2>کسب‌وکارهای منتشرشده در برغان</h2></div>
            </div>

            {localBusinesses.length > 0 ? (
              <div className="business-grid">
                {localBusinesses.map((business) => (
                  <a className={"business-card plan-card-" + business.planCode} href={`/business/${business.slug}`} key={business.slug}>
                    <div className="business-media business-generic">
                      {business.media.find((item) => item.kind === "cover")?.url || business.media[0]?.url ? (
                        <img
                          className="business-card-cover"
                          src={business.media.find((item) => item.kind === "cover")?.url || business.media[0]?.url}
                          alt={business.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="business-media-shape" />
                      )}
                    </div>
                    <div className="business-content">
                      <div className="business-title-row">
                        <h3>{business.name}</h3>
                        {(business.verificationStatus === "verified" || business.verificationStatus === "professional") && (
                          <BadgeCheck size={18} className="verified-icon" />
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
                <strong>هنوز کسب‌وکار منتشرشده‌ای در محدوده برغان نداریم.</strong>
                <p>این به معنی نبود فروشگاه یا متخصص در محدوده نیست. پس از ثبت، تکمیل و انتشار پروفایل‌های واقعی، گزینه‌های واجد شرایط در همین صفحه نمایش داده می‌شوند.</p>
                <a className="pill-button dark" href="/register-business">ثبت رایگان کسب‌وکار</a>
              </div>
            )}
          </div>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">سوالات متداول</span>
                <h2>دکوراسیون و خدمات خانه در برغان کرج</h2>
              </div>
            </div>
            <div className="guide-faq">
              {localFaqs.map((faq) => (
                <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
              ))}
            </div>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
