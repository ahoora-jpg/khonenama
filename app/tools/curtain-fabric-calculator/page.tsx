import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CurtainFabricCalculator from "@/components/CurtainFabricCalculator";
import { ArrowUpLeft, Scissors } from "lucide-react";

const url = "https://khonenama.ir/tools/curtain-fabric-calculator";
const title = "محاسبه متراژ پارچه پرده | محاسبه‌گر آنلاین خونه‌نما";
const description =
  "متراژ پارچه پرده را با عرض ریل، قد پرده، Fullness، عرض پارچه، اضافه دوخت و Pattern Repeat محاسبه کنید.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "محاسبه متراژ پارچه پرده",
    "محاسبه گر پرده",
    "چند متر پارچه برای پرده لازم است",
    "Fullness پرده",
    "Pattern Repeat پرده",
  ],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": url + "#app",
  name: "محاسبه‌گر متراژ پارچه پرده خونه‌نما",
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
    { "@type": "ListItem", position: 3, name: "محاسبه متراژ پارچه پرده", item: url },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "برای پرده چند متر پارچه لازم است؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "متراژ به عرض ریل، ضریب Fullness، عرض پارچه، قد نهایی، اضافه دوخت و در پارچه‌های طرح‌دار به Pattern Repeat بستگی دارد. محاسبه‌گر خونه‌نما این عوامل را با هم در نظر می‌گیرد.",
      },
    },
    {
      "@type": "Question",
      name: "Fullness پرده چیست؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fullness نسبت عرض تخت پارچه به عرض ریل است. مثلاً Fullness برابر 2 یعنی تقریباً دو برابر عرض ریل پارچه تخت برای ایجاد جمع در نظر گرفته می‌شود.",
      },
    },
    {
      "@type": "Question",
      name: "Pattern Repeat چرا متراژ را بیشتر می‌کند؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "در پارچه طرح‌دار طول هر برش باید طوری تنظیم شود که طرح در پنل‌ها هم‌تراز شود؛ بنابراین طول برش معمولاً تا تکرار کامل بعدی طرح افزایش پیدا می‌کند.",
      },
    },
  ],
};

export default function CurtainFabricCalculatorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page curtain-tool-page">
        <div className="shell wallpaper-tool-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/category/curtain">پرده</a><span>/</span><span>محاسبه‌گر پارچه</span>
          </nav>

          <header className="wallpaper-tool-hero curtain-tool-hero">
            <span className="section-kicker">ابزار رایگان خونه‌نما</span>
            <h1>محاسبه متراژ پارچه پرده</h1>
            <p>
              برای برآورد خرید پارچه، عرض ریل و قد پرده را با مشخصات همان پارچه وارد کنید.
              ابزار تعداد عرض پارچه، طول برش و متراژ تقریبی را محاسبه می‌کند.
            </p>
          </header>

          <CurtainFabricCalculator />

          <section className="wallpaper-tool-explainer">
            <div className="wallpaper-tool-copy">
              <span className="section-kicker">منطق محاسبه</span>
              <h2>عرض ریل، Fullness و طول هر برش</h2>
              <p>
                ابتدا عرض ریل در Fullness ضرب می‌شود تا عرض تخت پارچه مشخص شود. سپس تعداد عرض‌های
                کامل پارچه از روی عرض رول به دست می‌آید. طول هر برش از قد نهایی به‌علاوه اضافه دوخت
                ساخته می‌شود و برای پارچه طرح‌دار تا نزدیک‌ترین Pattern Repeat کامل افزایش پیدا می‌کند.
              </p>
            </div>

            <div className="wallpaper-tool-steps">
              <article>
                <span><Scissors size={18} /></span>
                <h3>۱. عرض ریل را بگیر</h3>
                <p>برای برآورد پارچه، عرض ریل یا میله مهم‌تر از عرض شیشه پنجره است.</p>
              </article>
              <article>
                <span>۲</span>
                <h3>۲. Fullness را مشخص کن</h3>
                <p>مدل دوخت و Heading روی ضریب جمع اثر دارد؛ عدد پیشنهادی خیاط اولویت دارد.</p>
              </article>
              <article>
                <span>۳</span>
                <h3>۳. Repeat پارچه را وارد کن</h3>
                <p>برای پارچه ساده صفر و برای پارچه طرح‌دار عدد روی مشخصات پارچه را وارد کن.</p>
              </article>
            </div>
          </section>

          <section className="wallpaper-tool-faq">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">پاسخ کوتاه</span>
                <h2>سوالات رایج متراژ پرده</h2>
              </div>
            </div>
            <div className="guide-faq">
              <details>
                <summary>Fullness دو برابر یعنی چه؟</summary>
                <p>یعنی برای هر ۱ متر عرض ریل تقریباً ۲ متر عرض تخت پارچه قبل از جمع و دوخت در نظر گرفته می‌شود.</p>
              </details>
              <details>
                <summary>پارچه Half-drop را همین ابزار دقیق حساب می‌کند؟</summary>
                <p>خیر. ابزار برای Repeat استاندارد برآورد می‌دهد و در صورت انتخاب Half-drop هشدار می‌دهد؛ سفارش نهایی باید با الگوی همان پارچه کنترل شود.</p>
              </details>
              <details>
                <summary>چرا متراژ نهایی از مساحت ساده بیشتر می‌شود؟</summary>
                <p>چون پارچه به‌صورت عرض‌های کامل بریده می‌شود و اضافه دوخت، گردکردن تعداد عرض‌ها و Pattern Match مصرف را افزایش می‌دهند.</p>
              </details>
            </div>
          </section>

          <section className="wallpaper-tool-next glass-panel">
            <div>
              <span className="section-kicker">مرحله بعد</span>
              <h2>مدل پرده و فروشنده مناسب را مقایسه کنید</h2>
              <p>بعد از برآورد متراژ، راهنماهای انتخاب و فروشگاه‌ها و مجریان مرتبط را ببینید.</p>
            </div>
            <div>
              <a href="/magazine/curtain-buying-guide">راهنمای خرید پرده <ArrowUpLeft size={15} /></a>
              <a href="/category/curtain">فروشگاه‌ها و متخصصان <ArrowUpLeft size={15} /></a>
              <a href="/karaj/curtain">پرده در کرج <ArrowUpLeft size={15} /></a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
