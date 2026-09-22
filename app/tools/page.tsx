import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpLeft, Calculator, HousePlug, Scissors } from "lucide-react";

const url = "https://khonenama.ir/tools";
const title = "ابزارهای خونه‌نما | محاسبه‌گرهای دکوراسیون و خانه";
const description =
  "ابزارهای رایگان خونه‌نما برای اندازه‌گیری و تصمیم‌گیری بهتر در دکوراسیون؛ از محاسبه تعداد رول کاغذ دیواری تا ابزارهای بعدی پرده و خانه هوشمند.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": url + "#webpage",
  url,
  name: title,
  description,
  inLanguage: "fa-IR",
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  hasPart: [
    {
      "@type": "WebApplication",
      name: "محاسبه‌گر تعداد رول کاغذ دیواری",
      url: "https://khonenama.ir/tools/wallpaper-calculator",
    },
    {
      "@type": "WebApplication",
      name: "محاسبه‌گر متراژ پارچه پرده",
      url: "https://khonenama.ir/tools/curtain-fabric-calculator",
    },
    {
      "@type": "WebApplication",
      name: "برآورد Scope خانه هوشمند",
      url: "https://khonenama.ir/tools/smart-home-scope",
    },
  ],
};

export default function ToolsPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <Header />

      <section className="inner-page tools-page">
        <div className="shell tools-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><span>ابزارها</span>
          </nav>

          <header className="tools-hero glass-panel">
            <span className="section-kicker">ابزارهای رایگان خونه‌نما</span>
            <h1>کمتر حدس بزن؛ دقیق‌تر اندازه بگیر.</h1>
            <p>
              ابزارهای کاربردی برای محاسبه، اندازه‌گیری و تصمیم‌گیری قبل از خرید یا اجرا.
              ابزارهای بعدی پرده و خانه هوشمند هم به همین مجموعه اضافه می‌شوند.
            </p>
          </header>

          <section className="tools-grid" aria-label="فهرست ابزارها">
            <a className="tool-card glass-panel" href="/tools/wallpaper-calculator">
              <span className="tool-card-icon"><Calculator size={24} /></span>
              <div>
                <span className="section-kicker">کاغذ دیواری</span>
                <h2>محاسبه تعداد رول کاغذ دیواری</h2>
                <p>عرض و ارتفاع دیوار، ابعاد رول، Pattern Repeat و پرت را وارد کنید و تعداد رول لازم را بگیرید.</p>
              </div>
              <ArrowUpLeft size={18} />
            </a>

            <a className="tool-card glass-panel" href="/tools/curtain-fabric-calculator">
              <span className="tool-card-icon"><Scissors size={24} /></span>
              <div>
                <span className="section-kicker">پرده</span>
                <h2>محاسبه متراژ پارچه پرده</h2>
                <p>عرض ریل، قد پرده، Fullness، عرض پارچه و Pattern Repeat را وارد کنید و متراژ تقریبی را بگیرید.</p>
              </div>
              <ArrowUpLeft size={18} />
            </a>

            <a className="tool-card glass-panel" href="/tools/smart-home-scope">
              <span className="tool-card-icon"><HousePlug size={24} /></span>
              <div>
                <span className="section-kicker">خانه هوشمند</span>
                <h2>برآورد Scope اولیه پروژه</h2>
                <p>تعداد نقاط روشنایی، پرده، دما، امنیت و سنسورها را مشخص کنید و محدوده پروژه را برای مقایسه پیشنهادها بسازید.</p>
              </div>
              <ArrowUpLeft size={18} />
            </a>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
