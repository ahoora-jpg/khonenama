import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarpetEstimator from "@/components/CarpetEstimator";
import { ArrowUpLeft, Grid3X3, Ruler } from "lucide-react";

const url = "https://khonenama.ir/tools/carpet-estimator";
const title = "هر رول موکت چند متر است؟ | محاسبه متراژ موکت رول و تایلی";
const description =
  "هر رول موکت چند متر است و برای اتاق چند متر موکت لازم دارید؟ متراژ موکت رول یا تعداد موکت تایلی را با ابعاد فضا، عرض رول، پرت و تعداد تایل محاسبه کنید.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "هر رول موکت چند متر است",
    "محاسبه متراژ موکت",
    "محاسبه گر موکت",
    "چند متر موکت لازم است",
    "محاسبه موکت رول",
    "محاسبه موکت تایلی",
  ],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": url + "#app",
  name: "محاسبه‌گر متراژ موکت خونه نما",
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
    { "@type": "ListItem", position: 3, name: "محاسبه متراژ موکت", item: url },
  ],
};

const faqs = [
  { question: "هر رول موکت چند متر است؟", answer: "طول و عرض رول برای همه محصولات یکسان نیست؛ مشخصات همان محصول را بررسی کنید. مساحت یک رول برابر عرض رول × طول رول است. برای خرید فضای شما، طول برش‌های لازم، جهت نصب و پرت نیز باید محاسبه شوند." },
  { question: "موکت رول را چطور محاسبه کنیم؟", answer: "تعداد نوارهای لازم از تقسیم عرض فضا بر عرض رول و گرد کردن رو به بالا به دست می‌آید. سپس تعداد نوارها در طول هر نوار ضرب می‌شود و پرت برش اضافه می‌شود. جهت خواب یا طرح موکت را پیش از انتخاب جهت نصب بررسی کنید." },
  { question: "برای موکت تایلی چند بسته لازم است؟", answer: "مساحت فضا بر مساحت هر تایل تقسیم می‌شود، پرت اضافه می‌شود و سپس تعداد تایل موردنیاز بر تعداد تایل هر بسته تقسیم و رو به بالا گرد می‌شود." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function CarpetEstimatorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page carpet-tool-page">
        <div className="shell wallpaper-tool-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه نما</a><span>/</span><a href="/category/carpet">موکت</a><span>/</span><span>محاسبه متراژ</span>
          </nav>

          <header className="wallpaper-tool-hero carpet-tool-hero">
            <span className="section-kicker">ابزار رایگان خونه نما</span>
            <h1>محاسبه متراژ موکت رول و تایلی</h1>
            <p>
              اگر می‌پرسید هر رول موکت چند متر است، مشخصات همان محصول را بررسی کنید؛ برای خرید واقعی، عرض رول، طول برش و پرت مهم‌اند. این ابزار مقدار موردنیاز را بر اساس ابعاد فضای شما حساب می‌کند.
            </p>
          </header>

          <CarpetEstimator />

          <section className="wallpaper-tool-explainer">
            <div className="wallpaper-tool-copy">
              <span className="section-kicker">چرا فقط مترمربع کافی نیست؟</span>
              <h2>عرض رول و چیدمان تایل روی خرید واقعی اثر دارند</h2>
              <p>
                اتاق ۱۵ مترمربعی الزاماً به ۱۵ مترمربع موکت خرید نیاز ندارد. در موکت رول، عرض ثابت رول و تعداد نوارها
                می‌تواند پرت بسازد؛ در موکت تایلی هم بسته‌بندی و برش کناره‌ها روی تعداد واقعی خرید اثر می‌گذارند.
              </p>
            </div>

            <div className="wallpaper-tool-steps">
              <article>
                <span><Ruler size={18} /></span>
                <h3>۱. ابعاد واقعی فضا</h3>
                <p>عرض و طول کف را در چند نقطه بگیرید؛ دیوارهای کاملاً موازی را فرض نکنید.</p>
              </article>
              <article>
                <span><Grid3X3 size={18} /></span>
                <h3>۲. مشخصات همان محصول</h3>
                <p>عرض رول یا اندازه تایل و تعداد داخل بسته را از مشخصات محصول وارد کنید.</p>
              </article>
              <article>
                <span>۳</span>
                <h3>۳. جهت نصب را کنترل کنید</h3>
                <p>در موکت‌های دارای خواب یا طرح، یک‌جهت بودن نوارها از کمترین مصرف مهم‌تر است.</p>
              </article>
            </div>
          </section>

          <section className="wallpaper-tool-faq">
            <div className="guide-faq">
              {faqs.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="wallpaper-tool-next glass-panel">
            <div>
              <span className="section-kicker">مرحله بعد</span>
              <h2>نوع موکت و فروشنده را مقایسه کنید</h2>
              <p>بعد از برآورد متراژ، درباره جنس الیاف، پرز، تراکم، زیرسازی و نصب تصمیم بگیرید.</p>
            </div>
            <div>
              <a href="/magazine/carpet-buying-guide">راهنمای خرید موکت <ArrowUpLeft size={15} /></a>
              <a href="/category/carpet">فروشگاه‌ها و متخصصان <ArrowUpLeft size={15} /></a>
              <a href="/category/carpet">فروشگاه‌ها و خدمات موکت <ArrowUpLeft size={15} /></a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
