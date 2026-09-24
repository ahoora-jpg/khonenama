import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, Calculator, Clock3 } from "lucide-react";

const url = "https://khonenama.ir/magazine/shade-curtain-guide";
const title = "پرده شید چیست؟ انواع شید و کاربرد هر مدل";
const description = "شید رول چیست و چه تفاوتی با زبرا دارد؟ شید ساده، اسکرین و بلک‌اوت را از نظر نور، حریم خصوصی، نصب و کاربرد مقایسه کنید.";
const visual = getGuideVisual("پرده");
const modifiedAt = "2026-09-24";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["پرده شید چیست", "انواع پرده شید", "شید رول", "شید بلک اوت", "شید اسکرین", "پرده شید یا زبرا"],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "article",
    locale: "fa_IR",
    publishedTime: "2026-09-19",
    modifiedTime: modifiedAt,
    authors: ["https://khonenama.ir/about"],
    images: [{ url: visual.src, alt: visual.alt }],
  },
  twitter: { card: "summary_large_image", title, description, images: [visual.src] },
};

const faqs = [
  {
    question: "پرده شید برای اتاق خواب مناسب است؟",
    answer: "بله. اگر تاریکی بیشتر می‌خواهید شید بلک‌اوت یا پارچه متراکم‌تر را بررسی کنید و به نشت نور از کناره‌ها هم توجه داشته باشید.",
  },
  {
    question: "پرده شید بهتر است یا زبرا؟",
    answer: "اگر ظاهر یکدست و ساده می‌خواهید شید انتخاب مناسبی است؛ اگر تنظیم مرحله‌ای نور بدون بالا بردن کامل پرده برایتان مهم است زبرا انعطاف بیشتری دارد.",
  },
  {
    question: "شید اسکرین چه کاربردی دارد؟",
    answer: "شید اسکرین برای کاهش خیرگی و کنترل بخشی از نور طراحی می‌شود و در بعضی بافت‌ها دید نسبی به بیرون را حفظ می‌کند. میزان عملکرد به مشخصات همان پارچه بستگی دارد.",
  },
  {
    question: "برای سفارش شید چه چیزی را اندازه بگیریم؟",
    answer: "عرض و ارتفاع محل نصب، نوع نصب دیواری یا سقفی، قاب و دستگیره پنجره و فضای لازم برای رول باید قبل از سفارش مشخص شوند. اندازه نهایی بهتر است با فروشنده یا نصاب تأیید شود.",
  },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  datePublished: "2026-09-19",
  dateModified: modifiedAt,
  inLanguage: "fa-IR",
  mainEntityOfPage: url,
  author: { "@id": "https://khonenama.ir/#organization" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  image: [visual.src],
  articleSection: "پرده",
  abstract: "پرده شید یک پوشش یک‌تکه است که روی محور جمع می‌شود. نوع پارچه مشخص می‌کند شید نور را نرم فیلتر کند، خیرگی را کاهش دهد یا برای تاریکی بیشتر استفاده شود.",
  about: ["پرده شید", "شید رول", "شید اسکرین", "شید بلک‌اوت", "پرده زبرا"].map((name) => ({ "@type": "Thing", name })),
  isAccessibleForFree: true,
  isPartOf: { "@id": "https://khonenama.ir/#website" },
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

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خونه‌نما", item: "https://khonenama.ir/" },
    { "@type": "ListItem", position: 2, name: "مجله", item: "https://khonenama.ir/magazine" },
    { "@type": "ListItem", position: 3, name: "پرده شید", item: url },
  ],
};

export default function ShadeCurtainGuidePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <article className="inner-page guide-page">
        <div className="shell guide-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/magazine">مجله</a><span>/</span><a href="/category/curtain">پرده</a><span>/</span><span>پرده شید</span>
          </nav>

          <header className="guide-header">
            <span className="section-kicker">پرده</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="guide-meta"><span><Clock3 size={14} /> ۸ دقیقه</span><span>به‌روزرسانی: ۱۴۰۵/۰۷/۰۲</span></div>
          </header>

          <section className="guide-quick-answer glass-panel" aria-label="پاسخ کوتاه">
            <span className="section-kicker">پاسخ کوتاه</span>
            <p>پرده شید یا شید رول یک پوشش پنجره یک‌تکه است که روی محور بالای پنجره جمع می‌شود. شید ساده نور را فیلتر می‌کند، شید اسکرین برای کنترل خیرگی و حفظ نسبی دید کاربرد دارد و شید بلک‌اوت برای کاهش بسیار بیشتر نور استفاده می‌شود. انتخاب درست به نور، حریم خصوصی، نوع اتاق و محل نصب بستگی دارد.</p>
          </section>

          <figure className="guide-hero-image">
            <img src={visual.src} alt="نمونه پرده شید در فضای داخلی" />
            <figcaption>نوع پارچه و محل نصب روی میزان نور و حریم خصوصی اثر مستقیم دارند.</figcaption>
          </figure>

          <div className="guide-layout">
            <div className="guide-content">
              <section>
                <h2>پرده شید چیست و چگونه کار می‌کند؟</h2>
                <p>شید یک سطح پارچه‌ای پیوسته است که با مکانیزم رول بالا و پایین می‌رود. ظاهر کم‌حجم آن برای پنجره‌هایی که به پوشش ساده و مرتب نیاز دارند کاربردی است و می‌تواند دستی یا، در مدل‌های سازگار، موتوردار باشد.</p>
                <p>رفتار واقعی شید را پارچه تعیین می‌کند؛ دو شید با ظاهر مشابه می‌توانند عبور نور و حریم خصوصی متفاوتی داشته باشند. به همین دلیل مشخصات پارچه مهم‌تر از نام کلی «شید» است.</p>
              </section>

              <section>
                <h2>شید ساده، اسکرین و بلک‌اوت چه فرقی دارند؟</h2>
                <ul>
                  <li><strong>شید ساده یا نیمه‌شفاف:</strong> برای نرم‌کردن نور و ایجاد ظاهر یکدست.</li>
                  <li><strong>شید اسکرین:</strong> برای کاهش خیرگی و کنترل نور روز؛ میزان دید بیرون به بافت و درصد بازشدگی پارچه وابسته است.</li>
                  <li><strong>شید بلک‌اوت:</strong> برای اتاق خواب یا فضاهایی که کاهش شدیدتر نور مهم است؛ نصب و نشت نور کناره‌ها هم در نتیجه نهایی اثر دارند.</li>
                  <li><strong>شید چاپی و دکوراتیو:</strong> وقتی نقش تصویری یا هماهنگی با دکوراسیون اولویت بیشتری دارد.</li>
                </ul>
              </section>

              <section>
                <h2>پرده شید یا زبرا؛ کدام برای خانه مناسب‌تر است؟</h2>
                <p>زبرا از نوارهای شفاف و مات دو لایه استفاده می‌کند و امکان تنظیم تدریجی نور را بدون بالا بردن کامل پرده می‌دهد. شید یک سطح پیوسته‌تر دارد و معمولاً ظاهر مینیمال‌تری ایجاد می‌کند.</p>
                <p>اگر کنترل مرحله‌ای نور در طول روز مهم است، زبرا را هم مقایسه کنید. اگر سطح ساده، جمع‌وجور و یکدست می‌خواهید، شید می‌تواند انتخاب مناسب‌تری باشد. برای مقایسه جزئی‌تر، راهنمای <a href="/magazine/zebra-vs-shade">پرده زبرا یا شید</a> را ببینید.</p>
              </section>

              <section>
                <h2>برای اتاق خواب، پذیرایی و آشپزخانه چه شیدی انتخاب کنیم؟</h2>
                <p>برای اتاق خواب معمولاً کنترل نور و حریم خصوصی اولویت دارد؛ بنابراین شید بلک‌اوت یا پارچه متراکم‌تر ارزش بررسی دارد. در نشیمن، میزان نور روز و دید بیرون مهم‌تر می‌شود و شید ساده یا اسکرین می‌تواند کاربردی باشد.</p>
                <p>در آشپزخانه، فاصله از اجاق و سینک، قابلیت نظافت و جنس پارچه را جدی بگیرید. هیچ نوع شیدی صرفاً به‌دلیل نام مدل برای همه آشپزخانه‌ها مناسب نیست.</p>
              </section>

              <section>
                <h2>نصب دیواری یا سقفی شید چه تفاوتی ایجاد می‌کند؟</h2>
                <p>محل نصب باید قبل از اندازه‌گیری نهایی مشخص شود. نصب دیواری پایه را روی دیوار بالای قاب قرار می‌دهد و نصب سقفی پایه را به سقف یا سطح بالایی مناسب متصل می‌کند. نوع سطح، دستگیره پنجره، فضای بازشو و عرض پوشش موردنیاز روی انتخاب اثر دارند.</p>
                <p>اگر درباره محل نصب مطمئن نیستید، راهنمای <a href="/magazine/curtain-installation-guide">نصب پرده دیواری و سقفی</a> را قبل از سفارش بخوانید.</p>
              </section>

              <section>
                <h2>چک‌لیست قبل از سفارش پرده شید</h2>
                <ul>
                  <li>میزان عبور نور و حریم خصوصی موردنیاز را مشخص کنید.</li>
                  <li>نوع نصب دیواری یا سقفی را قبل از اندازه نهایی تعیین کنید.</li>
                  <li>کیفیت پارچه، لوله رول، مکانیزم و یراق را مقایسه کنید.</li>
                  <li>شرایط نظافت پارچه را از فروشنده بپرسید.</li>
                  <li>هزینه اندازه‌گیری، حمل و نصب را همراه محصول مقایسه کنید.</li>
                  <li>برای موتور یا کنترل هوشمند، برق و دسترسی سرویس را قبل از اجرا بررسی کنید.</li>
                </ul>
              </section>

              <section className="guide-faq">
                <h2>سوالات متداول</h2>
                {faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
              </section>
            </div>

            <aside className="guide-side">
              <div className="guide-side-card guide-tool-link glass-panel">
                <Calculator size={18} />
                <h3>متراژ پارچه پرده را برآورد کن</h3>
                <p>برای پرده‌های پارچه‌ای، عرض ریل، قد، Fullness و تکرار طرح را با ابزار خونه‌نما محاسبه کنید.</p>
                <a href="/tools/curtain-fabric-calculator">محاسبه‌گر پرده <ArrowUpLeft size={15} /></a>
              </div>
              <div className="guide-side-card glass-panel">
                <h3>مسیر بعدی</h3>
                <a href="/category/curtain">راهنمای جامع پرده <ArrowUpLeft size={15} /></a>
                <a href="/karaj/curtain">پرده در کرج <ArrowUpLeft size={15} /></a>
                <a href="/magazine/blackout-curtain-guide">راهنمای بلک‌اوت <ArrowUpLeft size={15} /></a>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
