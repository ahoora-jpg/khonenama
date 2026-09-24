import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WallpaperCalculator from "@/components/WallpaperCalculator";
import { ArrowUpLeft, BookOpen, Ruler } from "lucide-react";

const url = "https://khonenama.ir/tools/wallpaper-calculator";
const title = "محاسبه تعداد رول کاغذ دیواری | ابزار آنلاین";
const description =
  "تعداد رول کاغذ دیواری را با درنظرگرفتن عرض و طول رول، ارتفاع و عرض دیوار، Pattern Repeat، تلرانس برش و پرت محاسبه کنید.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "محاسبه تعداد رول کاغذ دیواری",
    "محاسبه گر کاغذ دیواری",
    "چند رول کاغذ دیواری لازم دارم",
    "محاسبه متراژ کاغذ دیواری",
    "Pattern Repeat کاغذ دیواری",
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    locale: "fa_IR",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": url + "#app",
  name: "محاسبه‌گر تعداد رول کاغذ دیواری خونه‌نما",
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
    { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir/" },
    { "@type": "ListItem", position: 2, name: "ابزارها", item: "https://khonenama.ir/tools" },
    { "@type": "ListItem", position: 3, name: "محاسبه تعداد رول کاغذ دیواری", item: url },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "چطور تعداد رول کاغذ دیواری را محاسبه کنیم؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "برای محاسبه دقیق‌تر باید تعداد نوارهای لازم، عرض رول، ارتفاع دیوار، طول هر نوار، Pattern Repeat و تعداد نوار قابل برش از هر رول را در نظر گرفت. محاسبه صرفاً بر اساس مترمربع ممکن است برای طرح‌های تکرارشونده کم‌برآورد ایجاد کند.",
      },
    },
    {
      "@type": "Question",
      name: "Pattern Repeat در تعداد رول چه اثری دارد؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "اگر طرح تکرار داشته باشد، طول هر نوار باید تا نزدیک‌ترین تکرار کامل طرح افزایش پیدا کند. هرچه Repeat بزرگ‌تر باشد، معمولاً پرت و تعداد رول موردنیاز بیشتر می‌شود.",
      },
    },
    {
      "@type": "Question",
      name: "آیا باید مساحت در و پنجره را از کاغذ دیواری کم کنیم؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "برای برآورد مساحت خالص می‌توان بازشوهای بزرگ را کم کرد، اما برای تعیین تعداد رول بهتر است روش نوار استفاده شود؛ چون معمولاً بخشی از نوارها در بالا، پایین یا کنار بازشو مصرف می‌شوند.",
      },
    },
  ],
};

export default function WallpaperCalculatorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page wallpaper-tool-page">
        <div className="shell wallpaper-tool-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/category/wallpaper">کاغذ دیواری</a><span>/</span><span>محاسبه‌گر رول</span>
          </nav>

          <header className="wallpaper-tool-hero">
            <span className="section-kicker">ابزار رایگان خونه‌نما</span>
            <h1>محاسبه تعداد رول کاغذ دیواری</h1>
            <p>
              اندازه دیوار و مشخصات رول را وارد کنید تا تعداد رول لازم بر اساس روش نوار،
              طول برش، تکرار طرح و پرت پیشنهادی محاسبه شود.
            </p>
          </header>

          <WallpaperCalculator />

          <section className="wallpaper-tool-explainer">
            <div className="wallpaper-tool-copy">
              <span className="section-kicker">چرا این روش دقیق‌تر است؟</span>
              <h2>فقط مترمربع کافی نیست</h2>
              <p>
                دو رول با مساحت اسمی یکسان می‌توانند تعداد نوار قابل استفاده متفاوتی بدهند.
                ارتفاع دیوار و تکرار طرح تعیین می‌کند از هر رول چند نوار کامل می‌توان برید.
                به همین دلیل محاسبه‌گر خونه‌نما ابتدا طول هر نوار را تعیین می‌کند و بعد تعداد رول را به دست می‌آورد.
              </p>
            </div>

            <div className="wallpaper-tool-steps">
              <article>
                <span><Ruler size={18} /></span>
                <h3>۱. عرض و ارتفاع را بگیرید</h3>
                <p>عرض کل دیوارهای قابل پوشش و ارتفاع واقعی را وارد کنید.</p>
              </article>
              <article>
                <span><BookOpen size={18} /></span>
                <h3>۲. لیبل رول را بخوانید</h3>
                <p>عرض، طول و Pattern Repeat را از مشخصات همان محصول وارد کنید.</p>
              </article>
              <article>
                <span>۳</span>
                <h3>۳. نتیجه را با نصاب چک کنید</h3>
                <p>نوع Match، Batch/Lot، گوشه‌ها و وضعیت واقعی دیوار می‌توانند روی سفارش نهایی اثر بگذارند.</p>
              </article>
            </div>
          </section>

          <section className="wallpaper-tool-faq">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">پاسخ کوتاه</span>
                <h2>سوالات رایج محاسبه کاغذ دیواری</h2>
              </div>
            </div>

            <div className="guide-faq">
              <details>
                <summary>چطور تعداد رول کاغذ دیواری را محاسبه کنیم؟</summary>
                <p>عرض دیوار را به عرض رول تقسیم کنید تا تعداد نوار لازم مشخص شود. سپس طول هر نوار را با ارتفاع، تلرانس برش و Pattern Repeat تنظیم کنید و ببینید از هر رول چند نوار کامل به دست می‌آید.</p>
              </details>
              <details>
                <summary>Pattern Repeat چه اثری روی تعداد رول دارد؟</summary>
                <p>هر بار که طرح باید در ارتفاع بعدی هم‌تراز شود، ممکن است بخشی از طول رول قابل استفاده نباشد. Repeat بزرگ‌تر معمولاً پرت بیشتری ایجاد می‌کند.</p>
              </details>
              <details>
                <summary>برای در و پنجره‌ها از متراژ کم کنیم؟</summary>
                <p>برای مساحت خالص می‌توانید بازشو را وارد کنید، اما تعداد رول ابزار عمداً با روش نوار محاسبه می‌شود تا به‌خاطر مصرف کاغذ در بالا، پایین و کنار بازشوها کم‌برآورد نشود.</p>
              </details>
            </div>
          </section>

          <section className="wallpaper-tool-next glass-panel">
            <div>
              <span className="section-kicker">مرحله بعد</span>
              <h2>حالا مدل و فروشنده مناسب را پیدا کنید</h2>
              <p>بعد از برآورد تعداد رول، راهنمای خرید را بخوانید یا فروشگاه‌ها و مجریان مرتبط را مقایسه کنید.</p>
            </div>
            <div>
              <a href="/magazine/wallpaper-guide">راهنمای انتخاب کاغذ دیواری <ArrowUpLeft size={15} /></a>
              <a href="/category/wallpaper">فروشگاه‌ها و متخصصان <ArrowUpLeft size={15} /></a>
              <a href="/karaj/wallpaper">کاغذ دیواری در کرج <ArrowUpLeft size={15} /></a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
