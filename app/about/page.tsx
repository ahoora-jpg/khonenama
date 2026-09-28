import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BadgeCheck, MapPin, Search, ShieldCheck, Store } from "lucide-react";

const pageUrl = "https://khonenama.ir/about";
const pageTitle = "خونه نما چیست؟ | مرجع دکوراسیون و فضای داخلی خانه";
const pageDescription =
  "خونه نما (Khonenama) مرجع دکوراسیون و فضای داخلی خانه برای پیدا کردن، مقایسه و ارتباط مستقیم با فروشگاه‌ها و متخصصان مرتبط است.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    images: [{ url: "https://khonenama.ir/images/editorial/photo-1600210492486-724fe5c67fb0.webp", width: 1200, height: 675, alt: "خونه نما؛ مرجع فضای داخلی خانه" }],
    siteName: "خونه نما",
    locale: "fa_IR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: pageTitle, description: pageDescription, images: ["https://khonenama.ir/images/editorial/photo-1600210492486-724fe5c67fb0.webp"] },
};

const aboutFaqs = [
  {
    question: "خونه نما چیست؟",
    answer: "خونه نما (Khonenama) مرجع فارسی برای شناخت و مقایسه موضوعات، فروشگاه‌ها و متخصصان مرتبط با دکوراسیون و فضای داخلی خانه است؛ با تمرکز اولیه بر کرج و استان البرز.",
  },
  {
    question: "آیا خونه نما درباره نمای بیرونی ساختمان است؟",
    answer: "خیر. موضوع خونه نما فضای داخلی خانه است؛ از پرده، کفپوش، موکت و کاغذ دیواری تا طراحی داخلی و خانه هوشمند. خونه نما سایت طراحی نمای ساختمان یا خرید و فروش ملک نیست.",
  },
  {
    question: "نام درست برند چگونه نوشته می‌شود؟",
    answer: "نام اصلی فارسی برند «خونه نما» با فاصله است و نام لاتین آن Khonenama است. دامنه رسمی برند khonenama.ir است.",
  },
];

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://khonenama.ir/about#page",
  url: pageUrl,
  name: "خونه نما چیست؟",
  description: pageDescription,
  inLanguage: "fa-IR",
  disambiguatingDescription: "خونه نما درباره دکوراسیون و فضای داخلی خانه است و با طراحی نمای بیرونی ساختمان، پلان معماری یا خرید و فروش ملک تفاوت دارد.",
  about: { "@id": "https://khonenama.ir/#organization" },
  mainEntity: { "@id": "https://khonenama.ir/#organization" },
  isPartOf: { "@id": "https://khonenama.ir/#website" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خونه نما", item: "https://khonenama.ir/" },
    { "@type": "ListItem", position: 2, name: "خونه نما چیست؟", item: pageUrl },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: aboutFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};
export default function AboutPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <section className="inner-page legal-page">
        <div className="shell legal-shell">
          <header className="legal-hero glass-panel">
            <span className="section-kicker">درباره خونه نما</span>
            <h1>خونه نما چیست؟ مرجع انتخاب برای فضای داخلی خانه</h1>
            <p>
              خونه نما (Khonenama) یک مرجع تخصصی برای دکوراسیون داخلی، متریال، اجرای فضای داخلی و خانه هوشمند است؛
              تمرکز خونه نما روی داخل خانه و انتخاب‌های مربوط به آن است: از پرده، کفپوش و موکت تا کاغذ دیواری، طراحی داخلی و هوشمندسازی.
            </p>
          </header>

          <article className="legal-content glass-panel">
            <h2>خونه نما چه کاری انجام می‌دهد؟</h2>
            <p>
              کاربر می‌تواند بر اساس دسته، شهر و محله جستجو کند، پروفایل کسب‌وکارها را ببیند،
              خدمات و نمونه‌کارهای ثبت‌شده را مقایسه کند و برای همان کسب‌وکار درخواست قیمت خصوصی بفرستد.
            </p>
            <h2>خونه نما با «نمای ساختمان» چه تفاوتی دارد؟</h2>
            <p>
              واژه «نما» در نام خونه نما به نمایش و کشف انتخاب‌های داخل خانه اشاره دارد. موضوع این سایت نمای بیرونی ساختمان،
              نقشه و پلان معماری یا خرید و فروش ملک نیست؛ تمرکز خونه نما مشخصاً روی دکوراسیون و فضای داخلی خانه است.
            </p>

            <h2>موضوعات اصلی خونه نما</h2>
            <div className="local-intent-grid">
              <a className="local-intent-card" href="/category/curtain"><h3>پرده و متعلقات</h3><p>زبرا، شید، پرده پارچه‌ای، اندازه‌گیری و نصب.</p></a>
              <a className="local-intent-card" href="/category/flooring"><h3>کفپوش و پارکت</h3><p>پارکت، لمینت، PVC، زیرسازی و اجرا.</p></a>
              <a className="local-intent-card" href="/category/carpet"><h3>موکت</h3><p>موکت رول و تایلی، متراژ، خرید و نصب.</p></a>
              <a className="local-intent-card" href="/category/wallpaper"><h3>کاغذ دیواری و دیوارپوش</h3><p>انتخاب، محاسبه رول، زیرسازی و اجرا.</p></a>
              <a className="local-intent-card" href="/category/interior-design"><h3>طراحی داخلی</h3><p>چیدمان، رنگ، نور و انتخاب طراح و مجری.</p></a>
              <a className="local-intent-card" href="/category/smart-home"><h3>خانه هوشمند</h3><p>روشنایی، پرده برقی، امنیت، سنسور و اتوماسیون.</p></a>
            </div>

            <section className="guide-faq" aria-label="سوالات متداول درباره خونه نما">
              <h2>سوالات متداول درباره خونه نما</h2>
              {aboutFaqs.map((faq) => (
                <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
              ))}
            </section>

            <div className="about-feature-grid">
              <div><Search size={20} /><strong>جستجوی تخصصی</strong><span>از پرده و کفپوش تا طراحی داخلی و خانه هوشمند</span></div>
              <div><MapPin size={20} /><strong>جستجوی محلی</strong><span>شروع از کرج و توسعه بر اساس حضور واقعی کسب‌وکارها</span></div>
              <div><Store size={20} /><strong>پروفایل حرفه‌ای</strong><span>اطلاعات، خدمات، ساعات کاری، گالری و راه‌های ارتباط</span></div>
              <div><ShieldCheck size={20} /><strong>درخواست خصوصی</strong><span>اطلاعات مشتری و پیشنهاد قیمت در صفحه عمومی نمایش داده نمی‌شود</span></div>
            </div>

            <h2>تأیید و تبلیغ دو چیز متفاوت‌اند</h2>
            <p>
              نشان تأیید برای اعتماد و بررسی کسب‌وکار است و خریدنی نیست. پلن حرفه‌ای یا ویژه
              می‌تواند امکانات و میزان دیده‌شدن را بیشتر کند، اما امتیاز کاربران یا نشان تأیید را نمی‌خرد.
            </p>

            <h2>محتوای خونه نما چگونه نوشته و به‌روزرسانی می‌شود؟</h2>
            <p>
              راهنماهای خونه نما برای پاسخ روشن به سوال‌های انتخاب، خرید، نصب و نگهداری نوشته می‌شوند. در مطالب آموزشی از رتبه‌بندی ساختگی، قیمت قطعی بدون منبع و ادعای تجربه مشتری استفاده نمی‌کنیم. جزئیات روش تولید و بازبینی محتوا در صفحه سیاست تحریریه منتشر شده است.
            </p>
            <p><a href="/editorial-policy">سیاست تحریریه و اصول محتوایی خونه نما</a></p>

            <h2>برای کسب‌وکارها</h2>
            <p>
              ثبت اولیه رایگان است. صاحب کسب‌وکار می‌تواند اطلاعات، خدمات، محدوده، ساعات کاری و
              تصاویر خودش را مدیریت کند و درخواست‌های مشتری را در پنل خصوصی ببیند.
            </p>

            <div className="legal-cta-row">
              <a className="pill-button dark" href="/register-business"><BadgeCheck size={16} /> ثبت کسب‌وکار</a>
              <a className="pill-button" href="/search">جستجوی کسب‌وکار</a>
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
