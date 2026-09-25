import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FlooringEstimator from "@/components/FlooringEstimator";
import { ArrowUpLeft, Layers3, Ruler } from "lucide-react";

const url = "https://khonenama.ir/tools/flooring-estimator";
const title = "محاسبه متراژ پارکت و لمینت | تعداد بسته و پرت";
const description =
  "متراژ پارکت، لمینت و کفپوش PVC را با ابعاد فضا، پوشش هر بسته، عرض رول و درصد پرت برآورد کنید و مقدار خرید اولیه را به دست آورید.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "محاسبه متراژ پارکت",
    "محاسبه متراژ لمینت",
    "محاسبه تعداد بسته لمینت",
    "محاسبه کفپوش",
    "محاسبه کفپوش PVC",
    "چند بسته لمینت لازم است",
  ],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": url + "#app",
  name: "محاسبه‌گر متراژ پارکت، لمینت و کفپوش خونه‌نما",
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
    { "@type": "ListItem", position: 3, name: "محاسبه متراژ پارکت و لمینت", item: url },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "چطور تعداد بسته لمینت را محاسبه کنیم؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "مساحت فضا را حساب کنید، درصد پرت متناسب با شکل و الگوی نصب اضافه کنید، سپس حاصل را بر پوشش مترمربعی هر بسته تقسیم و تعداد بسته را رو به بالا گرد کنید.",
      },
    },
    {
      "@type": "Question",
      name: "برای پارکت و لمینت چند درصد پرت در نظر بگیریم؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "پرت به شکل فضا، جهت نصب، ابعاد تایل یا پلانک و الگوی چیدمان بستگی دارد. ابزار مقدار پرت را قابل تنظیم گذاشته و عدد نهایی باید با مجری و مشخصات محصول کنترل شود.",
      },
    },
    {
      "@type": "Question",
      name: "کفپوش PVC رولی را چطور محاسبه کنیم؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "برای کفپوش رولی فقط مترمربع کافی نیست. عرض رول، تعداد نوارهای کامل، طول هر برش و امکان تغییر جهت رول روی متراژ طولی خرید اثر دارند.",
      },
    },
  ],
};

export default function FlooringEstimatorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page carpet-tool-page">
        <div className="shell wallpaper-tool-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/category/flooring">کفپوش و پارکت</a><span>/</span><span>محاسبه متراژ</span>
          </nav>

          <header className="wallpaper-tool-hero carpet-tool-hero">
            <span className="section-kicker">ابزار رایگان خونه‌نما</span>
            <h1>محاسبه متراژ پارکت، لمینت و کفپوش PVC</h1>
            <p>
              مساحت فضا، پرت و پوشش هر بسته را برای پارکت و لمینت حساب کنید؛ برای کفپوش PVC رولی، عرض رول و جهت برش را هم وارد محاسبه کنید.
            </p>
          </header>

          <FlooringEstimator />

          <section className="wallpaper-tool-explainer">
            <div className="wallpaper-tool-copy">
              <span className="section-kicker">چرا مترمربع خام کافی نیست؟</span>
              <h2>بسته‌بندی، الگوی نصب و عرض رول روی مقدار خرید اثر دارند</h2>
              <p>
                مساحت خالص فضا نقطه شروع است، نه مقدار نهایی سفارش. در لمینت و پارکت، خرید به بسته کامل انجام می‌شود و
                در کفپوش PVC رولی، عرض رول ممکن است پرت برش ایجاد کند. شکست‌های پلان، ستون، راهرو و جهت چیدمان هم باید در برآورد نهایی دیده شوند.
              </p>
            </div>

            <div className="wallpaper-tool-steps">
              <article>
                <span><Ruler size={18} /></span>
                <h3>۱. ابعاد واقعی فضا</h3>
                <p>طول و عرض را در چند نقطه اندازه بگیرید و فضاهای جدا مثل راهرو را مستقل حساب کنید.</p>
              </article>
              <article>
                <span><Layers3 size={18} /></span>
                <h3>۲. مشخصات همان محصول</h3>
                <p>پوشش مترمربعی هر بسته یا عرض واقعی رول را از لیبل یا مشخصات محصول وارد کنید.</p>
              </article>
              <article>
                <span>۳</span>
                <h3>۳. الگوی نصب را مشخص کنید</h3>
                <p>چیدمان مستقیم، مورب یا هفت‌وهشتی و همچنین جهت طرح یا بافت می‌توانند پرت را تغییر دهند.</p>
              </article>
            </div>
          </section>

          <section className="wallpaper-tool-faq">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">پاسخ کوتاه</span><h2>سوالات رایج محاسبه کفپوش</h2></div>
            </div>
            <div className="guide-faq">
              <details>
                <summary>چطور تعداد بسته لمینت را حساب کنیم؟</summary>
                <p>مساحت فضا را با پرت جمع کنید، سپس بر متراژ پوشش هر بسته تقسیم و نتیجه را رو به بالا گرد کنید؛ بسته ناقص قابل سفارش نیست.</p>
              </details>
              <details>
                <summary>برای پارکت و لمینت چند درصد پرت بگذاریم؟</summary>
                <p>یک عدد ثابت برای همه پروژه‌ها وجود ندارد. پلان ساده و نصب مستقیم معمولاً پرت کمتری از فضای شکسته یا الگوهای مورب و هفت‌وهشتی دارد.</p>
              </details>
              <details>
                <summary>برای PVC رولی چرا عرض رول مهم است؟</summary>
                <p>چون خرید به نوارهای کامل از رول وابسته است. اگر عرض فضا مضرب عرض رول نباشد، بخشی از متریال به‌صورت پرت باقی می‌ماند.</p>
              </details>
            </div>
          </section>

          <section className="wallpaper-tool-next glass-panel">
            <div>
              <span className="section-kicker">مرحله بعد</span>
              <h2>نوع کفپوش، زیرسازی و مجری را مقایسه کنید</h2>
              <p>بعد از برآورد متراژ، جنس، کلاس مصرف، مقاومت رطوبتی، فوم یا چسب، قرنیز و کیفیت اجرای زیرسازی را بررسی کنید.</p>
            </div>
            <div>
              <a href="/magazine/parquet-vs-laminate">پارکت یا لمینت؟ <ArrowUpLeft size={15} /></a>
              <a href="/category/flooring">فروشگاه‌ها و متخصصان <ArrowUpLeft size={15} /></a>
              <a href="/karaj/flooring">پارکت و لمینت در کرج <ArrowUpLeft size={15} /></a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
