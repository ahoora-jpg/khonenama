import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LightingEstimator from "@/components/LightingEstimator";
import { ArrowUpLeft } from "lucide-react";

const url = "https://khonenama.ir/tools/lighting-estimator";
const title = "محاسبه لومن مورد نیاز | لوکس × مساحت | خونه‌نما";
const description =
  "مساحت فضا و لوکس هدف را وارد کنید تا لومن نظری موردنیاز برای برآورد اولیه نورپردازی محاسبه شود؛ تفاوت لومن، لوکس و وات را هم ببینید.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "محاسبه لومن مورد نیاز",
    "محاسبه روشنایی اتاق",
    "محاسبه لوکس",
    "چند لومن برای اتاق",
    "محاسبه نورپردازی",
    "لومن و لوکس",
  ],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const faqs = [
  {
    question: "لومن با وات چه فرقی دارد؟",
    answer:
      "لومن مقدار کل نور مرئی خروجی منبع را توصیف می‌کند، در حالی که وات توان مصرفی است. دو چراغ با وات یکسان می‌توانند لومن متفاوتی داشته باشند.",
  },
  {
    question: "لوکس با لومن چه فرقی دارد؟",
    answer:
      "لومن شار نوری منبع است و لوکس میزان روشنایی روی سطح را بیان می‌کند؛ یک لوکس برابر یک لومن بر مترمربع است.",
  },
  {
    question: "آیا لومن نظری ابزار همان مجموع لومن چراغ‌هایی است که باید بخرم؟",
    answer:
      "نه لزوماً. این ابزار فقط مقدار نظری روی سطح را از مساحت و لوکس هدف به دست می‌آورد. توزیع نور، ارتفاع نصب، بازتاب سطوح، افت نور و نوع چراغ می‌توانند باعث شوند طراحی واقعی به شار نوری متفاوتی نیاز داشته باشد.",
  },
  {
    question: "لوکس هدف را از کجا انتخاب کنیم؟",
    answer:
      "لوکس هدف به نوع فضا و فعالیت بستگی دارد. برای پروژه واقعی از راهنمای معتبر یا طراح نور استفاده کنید و یک عدد ثابت را برای همه اتاق‌ها تعمیم ندهید.",
  },
];

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": url + "#app",
  name: "ابزار محاسبه لومن و لوکس خونه نما",
  url,
  description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "fa-IR",
  isAccessibleForFree: true,
  publisher: { "@id": "https://khonenama.ir/#organization" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خونه نما", item: "https://khonenama.ir/" },
    { "@type": "ListItem", position: 2, name: "ابزارها", item: "https://khonenama.ir/tools" },
    { "@type": "ListItem", position: 3, name: "محاسبه لومن نورپردازی", item: url },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function LightingEstimatorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page wallpaper-tool-page">
        <div className="shell wallpaper-tool-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه نما</a><span>/</span><a href="/category/lighting">نورپردازی داخلی</a><span>/</span><span>محاسبه لومن</span>
          </nav>

          <header className="wallpaper-tool-hero">
            <span className="section-kicker">ابزار رایگان خونه نما</span>
            <h1>محاسبه لومن موردنیاز از روی لوکس و مساحت</h1>
            <p>
              طول و عرض فضا و لوکس هدف را وارد کنید تا مقدار نظری نور روی سطح به دست آید. این ابزار برای مقایسه و
              برنامه‌ریزی اولیه است، نه طراحی نهایی چراغ و سیم‌کشی.
            </p>
          </header>

          <LightingEstimator />

          <section className="wallpaper-tool-explainer">
            <div className="wallpaper-tool-copy">
              <span className="section-kicker">سه واحد را قاطی نکنید</span>
              <h2>لومن، لوکس و وات چه چیزی را نشان می‌دهند؟</h2>
              <p>
                لومن مقدار نور خروجی را توصیف می‌کند؛ لوکس مقدار روشنایی روی سطح است و وات توان مصرفی را نشان می‌دهد.
                به همین دلیل برای مقایسه روشنایی LED، وات به‌تنهایی معیار کافی نیست.
              </p>
              <p>
                رابطه پایه این ابزار ساده است: یک لوکس یعنی یک لومن بر مترمربع. اما طراحی واقعی باید توزیع نور،
                خیرگی، یکنواختی، نور روز، ارتفاع و بازتاب سطوح را هم بررسی کند.
              </p>
            </div>
          </section>

          <section className="wallpaper-tool-faq">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">پاسخ کوتاه</span><h2>سوالات رایج محاسبه روشنایی</h2></div>
            </div>
            <div className="guide-faq">
              {faqs.map((faq) => (
                <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
              ))}
            </div>
          </section>

          <section className="guide-sources" aria-label="منابع">
            <h2>منابع برای ادامه بررسی</h2>
            <ul>
              <li><a href="https://store.ies.org/product/recommended-practice-lighting-for-interior-and-exterior-residential-environments/" target="_blank" rel="noopener noreferrer">IES — Recommended Practice for Residential Lighting (RP-11-26)</a></li>
              <li><a href="https://www.energy.gov/cmei/femp/purchasing-energy-efficient-light-bulbs" target="_blank" rel="noopener noreferrer">U.S. Department of Energy — Lumens and power input</a></li>
            </ul>
          </section>

          <section className="wallpaper-tool-next glass-panel">
            <div>
              <span className="section-kicker">مرحله بعد</span>
              <h2>نوع چراغ، پخش نور و مجری را مقایسه کنید</h2>
              <p>بعد از برآورد اولیه، چیدمان چراغ، دمای رنگ، کیفیت نور، درایور، دیمر و سازگاری ریل را برای همان پروژه بررسی کنید.</p>
            </div>
            <div>
              <a href="/category/lighting">راهنمای نورپردازی داخلی و مجریان <ArrowUpLeft size={15} /></a>
              <a href="/magazine/interior-lighting-guide">راهنمای نورپردازی داخل خانه <ArrowUpLeft size={15} /></a>
              <a href="/category/smart-home">روشنایی و کنترل هوشمند <ArrowUpLeft size={15} /></a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
