import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpLeft, Calculator, Grid3X3, HousePlug, Layers3, Scissors } from "lucide-react";

const url = "https://khonenama.ir/tools";
const title = "ابزارهای خونه‌نما | محاسبه‌گرهای دکوراسیون و خانه";
const description =
  "ابزارهای رایگان خونه‌نما برای محاسبه کاغذ دیواری، پرده، پارکت و لمینت، موکت و ساخت Scope اولیه خانه هوشمند.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

const toolFaqs = [
  {
    question: "برای محاسبه کاغذ دیواری فقط مترمربع دیوار کافی است؟",
    answer:
      "خیر. ارتفاع دیوار، عرض و طول رول، تعداد نوارهای قابل برش، Pattern Repeat و پرت روی تعداد رول نهایی اثر دارند؛ به همین دلیل ابزار کاغذ دیواری این متغیرها را جداگانه می‌گیرد.",
  },
  {
    question: "متراژ پارچه پرده به چه چیزهایی بستگی دارد؟",
    answer:
      "عرض ریل، قد نهایی، ضریب چین یا Fullness، عرض پارچه و در پارچه‌های طرح‌دار Pattern Repeat روی مصرف اثر دارند. ابزار پرده برای برآورد اولیه همین متغیرها را کنار هم قرار می‌دهد.",
  },
  {
    question: "Scope خانه هوشمند چه کمکی قبل از قیمت‌گیری می‌کند؟",
    answer:
      "Scope تعداد نقاط و نیازهای پروژه مثل روشنایی، پرده، دما، قفل، سنسور و دوربین را روشن می‌کند تا پیشنهاد چند مجری روی محدوده مشابه قابل مقایسه‌تر باشد؛ این ابزار جای طراحی مهندسی نهایی را نمی‌گیرد.",
  },
  {
    question: "برای موکت رول و تایلی یک روش محاسبه کافی است؟",
    answer:
      "خیر. در موکت رول عرض رول، جهت نوارها و پرت مهم است؛ در موکت تایلی ابعاد تایل، تعداد تایل در بسته و پرت تعیین‌کننده است. ابزار موکت هر دو حالت را جدا محاسبه می‌کند.",
  },
  {
    question: "برای پارکت و لمینت چطور تعداد بسته را حساب کنیم؟",
    answer:
      "مساحت فضا را با درصد پرت جمع کنید و حاصل را بر پوشش مترمربعی هر بسته تقسیم کنید. چون خرید معمولاً به بسته کامل انجام می‌شود، نتیجه باید رو به بالا گرد شود.",
  },
] as const;

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
      name: "محاسبه‌گر متراژ پارکت، لمینت و کفپوش",
      url: "https://khonenama.ir/tools/flooring-estimator",
    },
    {
      "@type": "WebApplication",
      name: "برآورد Scope خانه هوشمند",
      url: "https://khonenama.ir/tools/smart-home-scope",
    },
    {
      "@type": "WebApplication",
      name: "محاسبه متراژ موکت رول و تایلی",
      url: "https://khonenama.ir/tools/carpet-estimator",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: toolFaqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function ToolsPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
              ابزارهای کاربردی برای محاسبه، اندازه‌گیری و تصمیم‌گیری قبل از خرید یا اجرا؛
              از کاغذ دیواری و پرده تا پارکت، لمینت، موکت و Scope اولیه خانه هوشمند.
            </p>
          </header>

          <section className="category-results" aria-labelledby="tool-choice-heading">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">انتخاب ابزار بر اساس نیاز</span>
                <h2 id="tool-choice-heading">کدام محاسبه‌گر قبل از خرید یا اجرا به کارتان می‌آید؟</h2>
              </div>
            </div>
            <div className="local-intent-grid">
              <article className="local-intent-card">
                <h3>قبل از خرید کاغذ دیواری</h3>
                <p>تعداد رول را با ابعاد واقعی دیوار و رول، تکرار طرح و پرت برآورد کنید؛ بعد برای انتخاب جنس و زیرسازی، راهنمای <a href="/category/wallpaper">کاغذ دیواری و دیوارپوش</a> را ببینید.</p>
              </article>
              <article className="local-intent-card">
                <h3>قبل از سفارش پرده</h3>
                <p>عرض ریل، قد، Fullness و عرض پارچه را مشخص کنید. محل نصب سقفی یا دیواری باید پیش از اندازه‌گیری نهایی روشن باشد؛ برای جزئیات به <a href="/magazine/curtain-installation-guide">راهنمای نصب پرده</a> بروید.</p>
              </article>
              <article className="local-intent-card">
                <h3>قبل از خرید پارکت یا لمینت</h3>
                <p>مساحت، درصد پرت و پوشش هر بسته را مشخص کنید و برای کفپوش رولی عرض رول را هم وارد محاسبه کنید؛ سپس گزینه‌ها را در <a href="/category/flooring">راهنمای کفپوش و پارکت</a> مقایسه کنید.</p>
              </article>
              <article className="local-intent-card">
                <h3>قبل از خرید موکت</h3>
                <p>برای رول، عرض رول و جهت نوارها و برای تایلی، تعداد تایل و بسته را با پرت حساب کنید؛ سپس گزینه‌ها را در <a href="/category/carpet">راهنمای موکت</a> مقایسه کنید.</p>
              </article>
              <article className="local-intent-card">
                <h3>قبل از قیمت‌گیری خانه هوشمند</h3>
                <p>اول Scope نقاط و سناریوهای مورد نیاز را مشخص کنید تا پیشنهادهای مجری‌ها روی محدوده مشابه مقایسه شوند؛ بعد سراغ <a href="/category/smart-home">راهنمای خانه هوشمند</a> بروید.</p>
              </article>
            </div>
          </section>

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

            <a className="tool-card glass-panel" href="/tools/flooring-estimator">
              <span className="tool-card-icon"><Layers3 size={24} /></span>
              <div>
                <span className="section-kicker">پارکت و کفپوش</span>
                <h2>محاسبه متراژ پارکت و لمینت</h2>
                <p>مساحت، پرت و تعداد بسته را برای پارکت و لمینت محاسبه کنید؛ برای PVC رولی، عرض رول و متراژ طولی را هم ببینید.</p>
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

            <a className="tool-card glass-panel" href="/tools/carpet-estimator">
              <span className="tool-card-icon"><Grid3X3 size={24} /></span>
              <div>
                <span className="section-kicker">موکت</span>
                <h2>برآورد موکت رول و تایلی</h2>
                <p>برای رول، متراژ طولی و جهت نوارها؛ برای تایلی، تعداد تایل و بسته را با درصد پرت محاسبه کنید.</p>
              </div>
              <ArrowUpLeft size={18} />
            </a>
          </section>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">پاسخ سریع</span><h2>سوالات رایج درباره محاسبه قبل از اجرا</h2></div>
            </div>
            <div className="guide-faq">
              {toolFaqs.map((item) => (
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
