import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartHomeScopeCalculator from "@/components/SmartHomeScopeCalculator";
import { ArrowUpLeft } from "lucide-react";

const url = "https://khonenama.ir/tools/smart-home-scope";
const title = "برآورد Scope خانه هوشمند | ابزار برنامه‌ریزی خونه‌نما";
const description =
  "تعداد نقاط روشنایی، پرده، دما، قفل، سنسور، دوربین و پریز را وارد کنید و یک Scope اولیه برای مقایسه پیشنهاد مجریان خانه هوشمند بسازید.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "برآورد خانه هوشمند",
    "Scope خانه هوشمند",
    "محاسبه نقاط خانه هوشمند",
    "برنامه ریزی خانه هوشمند",
    "چک لیست خانه هوشمند",
  ],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": url + "#app",
  name: "ابزار برآورد Scope خانه هوشمند خونه‌نما",
  url,
  description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "fa-IR",
  isAccessibleForFree: true,
  publisher: { "@id": "https://khonenama.ir/#organization" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Scope خانه هوشمند چیست؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Scope فهرست روشن نیازها و تعداد نقاط پروژه است؛ مثل روشنایی، پرده، کنترل دما، قفل، سنسور و دوربین. با Scope یکسان می‌توان پیشنهاد چند مجری را قابل‌مقایسه‌تر کرد.",
      },
    },
    {
      "@type": "Question",
      name: "آیا این ابزار قیمت خانه هوشمند را محاسبه می‌کند؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "خیر. قیمت به زیرساخت، برند، پروتکل، سیم‌کشی، شبکه، سناریوها و اجرا بستگی دارد. ابزار فقط محدوده اولیه پروژه را مشخص می‌کند.",
      },
    },
  ],
};

export default function SmartHomeScopePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page smart-scope-page">
        <div className="shell wallpaper-tool-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/category/smart-home">خانه هوشمند</a><span>/</span><span>Scope اولیه</span>
          </nav>

          <header className="wallpaper-tool-hero smart-scope-hero">
            <span className="section-kicker">ابزار برنامه‌ریزی خونه‌نما</span>
            <h1>برآورد Scope اولیه خانه هوشمند</h1>
            <p>
              قبل از گرفتن قیمت، تعداد نقاط و نیازهای واقعی پروژه را مشخص کنید تا پیشنهاد مجری‌ها
              روی یک محدوده مشترک مقایسه شود.
            </p>
          </header>

          <SmartHomeScopeCalculator />

          <section className="wallpaper-tool-explainer">
            <div className="wallpaper-tool-copy">
              <span className="section-kicker">چرا Scope مهم است؟</span>
              <h2>قیمت بدون محدوده مشخص قابل مقایسه نیست</h2>
              <p>
                دو پیشنهاد ممکن است عددهای بسیار متفاوتی داشته باشند چون یکی شامل سنسور، پرده، شبکه،
                کنترل محلی و پشتیبانی است و دیگری فقط چند کلید هوشمند. Scope اولیه کمک می‌کند هر مجری
                روی نیازهای یکسان پیشنهاد بدهد.
              </p>
            </div>
          </section>

          <section className="wallpaper-tool-faq">
            <div className="guide-faq">
              <details>
                <summary>این خروجی جای طراحی مهندسی را می‌گیرد؟</summary>
                <p>خیر. این ابزار برای نیازسنجی و مقایسه پیشنهادهاست. نقشه برق، شبکه، بار، پروتکل و سناریوها باید در طراحی نهایی مشخص شوند.</p>
              </details>
              <details>
                <summary>برای خانه آماده و نوساز Scope فرق می‌کند؟</summary>
                <p>بله. در Retrofit محدودیت سیم‌کشی و تخریب مهم است؛ در نوساز می‌توان زیرساخت، تابلو و مسیر کابل را از ابتدا طراحی کرد.</p>
              </details>
            </div>
          </section>

          <section className="wallpaper-tool-next glass-panel">
            <div>
              <span className="section-kicker">بعد از Scope</span>
              <h2>پروتکل و مجری را مقایسه کنید</h2>
              <p>برای انتخاب معماری، کنترل محلی و سطح یکپارچگی، راهنماهای خانه هوشمند را بخوانید.</p>
            </div>
            <div>
              <a href="/magazine/matter-thread-zigbee-wifi-guide-2026">Matter، Thread و Zigbee <ArrowUpLeft size={15} /></a>
              <a href="/category/smart-home">متخصصان خانه هوشمند <ArrowUpLeft size={15} /></a>
              <a href="/karaj/smart-home">خانه هوشمند در کرج <ArrowUpLeft size={15} /></a>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
