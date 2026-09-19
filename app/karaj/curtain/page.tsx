import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses } from "@/lib/demo-data";
import { ArrowUpLeft, BadgeCheck, MapPin, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "پرده فروشی کرج | زبرا، شید و پرده منزل در کرج",
  description:
    "پرده‌فروشی‌های کرج را برای زبرا، شید، پرده پارچه‌ای، اندازه‌گیری و نصب مقایسه کنید. راهنمای انتخاب پرده ارزان، نزدیک و مناسب در خونه‌نما.",
  alternates: { canonical: "/karaj/curtain" },
  openGraph: {
    title: "پرده فروشی کرج | خونه‌نما",
    description: "فروشگاه‌ها و خدمات پرده در کرج را پیدا و مقایسه کنید.",
    url: "https://khonenama.ir/karaj/curtain",
    locale: "fa_IR",
    type: "website",
  },
};

const curtainBusinesses = businesses.filter(
  (business) => business.city === "کرج" && business.category === "curtain"
);

const faq = [
  {
    question: "چطور پرده‌فروشی مناسب در کرج پیدا کنیم؟",
    answer:
      "نمونه‌کار، تخصص فروشگاه، کیفیت پارچه و یراق، خدمات اندازه‌گیری و نصب، موقعیت و شرایط ضمانت را کنار هم مقایسه کنید.",
  },
  {
    question: "نزدیک‌ترین پرده‌فروشی همیشه بهترین انتخاب است؟",
    answer:
      "نه لزوماً. نزدیکی برای اندازه‌گیری و نصب مزیت است، اما کیفیت اجرا، مدل‌های موجود و خدمات پس از فروش هم اهمیت دارند.",
  },
  {
    question: "برای پیدا کردن پرده ارزان در کرج چه چیزی را مقایسه کنیم؟",
    answer:
      "قیمت را فقط وقتی مقایسه کنید که نوع پارچه، ابعاد، مکانیزم، دوخت و هزینه نصب بین گزینه‌ها مشخص باشد.",
  },
  {
    question: "پرده قسطی در کرج را چطور بررسی کنیم؟",
    answer:
      "شرایط اقساط، پیش‌پرداخت، تعداد اقساط، مبلغ نهایی و اینکه نصب و یراق در قیمت لحاظ شده یا نه را مستقیماً از فروشنده تأیید کنید.",
  },
];

export default function KarajCurtainPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "پرده فروشی‌های کرج",
    itemListElement: curtainBusinesses.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: business.name,
      url: "https://khonenama.ir/business/" + business.slug,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir" },
      { "@type": "ListItem", position: 2, name: "کرج", item: "https://khonenama.ir/karaj" },
      { "@type": "ListItem", position: 3, name: "پرده در کرج", item: "https://khonenama.ir/karaj/curtain" },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <section className="inner-page">
        <div className="shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/karaj">کرج</a><span>/</span><span>پرده</span>
          </nav>

          <div className="category-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه‌نما</span>
            <h1>پرده فروشی در کرج</h1>
            <p>
              فروشگاه‌ها و خدمات پرده در کرج را برای زبرا، شید، پرده پارچه‌ای، اندازه‌گیری و نصب پیدا و مقایسه کنید.
            </p>
          </div>

          <section className="local-intent-grid">
            <div className="local-intent-card">
              <h2>بهترین پرده‌فروشی کرج را چطور انتخاب کنیم؟</h2>
              <p>
                «بهترین» برای هر مشتری یکسان نیست. فروشگاهی که در زبرا قوی است ممکن است برای پرده پارچه‌ای یا اجرای کلاسیک گزینه اول نباشد.
                نمونه‌کار، کیفیت متریال، تخصص و خدمات نصب را متناسب با نیاز خودتان بسنجید.
              </p>
            </div>
            <div className="local-intent-card">
              <h2>پرده ارزان در کرج؛ مقایسه درست قیمت</h2>
              <p>
                قیمت پایین را فقط با مشخصات یکسان مقایسه کنید. نوع پارچه، مکانیزم، دوخت، یراق، اندازه‌گیری و نصب می‌توانند اختلاف قیمت زیادی ایجاد کنند.
              </p>
            </div>
            <div className="local-intent-card">
              <h2>پرده‌فروشی نزدیک من</h2>
              <p>
                برای خدماتی مثل اندازه‌گیری و نصب، فاصله مهم است. محدوده فعالیت فروشگاه را در پروفایل بررسی کنید و بعد کیفیت اجرا را با نزدیکی مقایسه کنید.
              </p>
            </div>
            <div className="local-intent-card">
              <h2>پرده قسطی در کرج</h2>
              <p>
                اگر خرید اقساطی برایتان مهم است، شرایط واقعی هر فروشنده را جداگانه بررسی کنید؛ پیش‌پرداخت، مدت اقساط و مبلغ نهایی ممکن است متفاوت باشد.
              </p>
            </div>
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">فروشگاه‌ها و خدمات</span>
                <h2>پرده در کرج</h2>
              </div>
            </div>

            {curtainBusinesses.length > 0 ? (
              <div className="business-grid">
                {curtainBusinesses.map((business) => (
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
                <strong>پروفایل‌های پرده‌فروشی کرج در حال تکمیل هستند.</strong>
              </div>
            )}
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">راهنمای خرید</span>
                <h2>قبل از انتخاب پرده بخوانید</h2>
              </div>
            </div>
            <div className="category-guide-grid">
              <a className="category-guide-card" href="/magazine/zebra-curtain-guide">
                <div><h3>پرده زبرا چیست؟</h3><p>مزایا، معایب و انواع زبرا</p></div><ArrowUpLeft size={16} />
              </a>
              <a className="category-guide-card" href="/magazine/zebra-curtain-price-guide">
                <div><h3>قیمت پرده زبرا</h3><p>عوامل مؤثر بر قیمت و مقایسه درست</p></div><ArrowUpLeft size={16} />
              </a>
              <a className="category-guide-card" href="/magazine/best-curtain-living-room">
                <div><h3>بهترین پرده برای پذیرایی</h3><p>انتخاب بر اساس نور و سبک</p></div><ArrowUpLeft size={16} />
              </a>
            </div>
          </section>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading"><div><h2>سوالات متداول درباره پرده در کرج</h2></div></div>
            <div className="guide-faq">
              {faq.map((item) => (
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
