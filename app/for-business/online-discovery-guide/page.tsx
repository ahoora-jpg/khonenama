import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpLeft, BadgeCheck, MapPin, Search, Store } from "lucide-react";

const pageUrl = "https://khonenama.ir/for-business/online-discovery-guide";
const pageTitle = "چطور کسب‌وکار دکوراسیون را آنلاین معرفی کنیم؟";
const pageDescription =
  "راهنمای معرفی آنلاین فروشگاه و متخصص دکوراسیون؛ از اطلاعات پروفایل و جستجوی محلی تا تصاویر واقعی، خدمات، محدوده فعالیت و مسیر تماس مشتری.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: "خونه‌نما",
    locale: "fa_IR",
    type: "article",
  },
};

const faqs = [
  {
    question: "برای معرفی آنلاین کسب‌وکار دکوراسیون چه اطلاعاتی ضروری است؟",
    answer:
      "نام واقعی کسب‌وکار، دسته و خدمات دقیق، شهر و محدوده فعالیت، توضیح روشن، راه تماس و تصاویر واقعی پایه کار هستند. اطلاعات ناقص یا کلی باعث می‌شود کاربر و موتور جستجو سخت‌تر متوجه شوند دقیقاً چه خدمتی ارائه می‌کنید.",
  },
  {
    question: "دایرکتوری تخصصی چه فرقی با آگهی عمومی دارد؟",
    answer:
      "دایرکتوری تخصصی معمولاً اطلاعات کسب‌وکار را بر اساس دسته، خدمت و موقعیت سازمان‌دهی می‌کند تا کاربر بتواند گزینه‌های مرتبط را پیدا و مقایسه کند. کیفیت نتیجه به ساختار پلتفرم و کامل بودن اطلاعات واقعی پروفایل بستگی دارد.",
  },
  {
    question: "برای دیده‌شدن محلی فقط نام شهر کافی است؟",
    answer:
      "خیر. شهر و محدوده فعالیت باید کنار نوع خدمت، توضیح دقیق و اطلاعات تماس واقعی قرار بگیرند. اگر در چند محله یا شهر خدمات می‌دهید، محدوده را شفاف و واقعی ثبت کنید.",
  },
  {
    question: "آیا ساخت پروفایل به‌تنهایی مشتری تضمین می‌کند؟",
    answer:
      "خیر. پروفایل کامل بخشی از مسیر دیده‌شدن است. کیفیت واقعی خدمت، پاسخ‌گویی، تصاویر معتبر، به‌روز نگه‌داشتن اطلاعات و حضور در کانال‌های مناسب هم روی نتیجه اثر دارند.",
  },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": pageUrl + "#article",
  headline: pageTitle,
  description: pageDescription,
  mainEntityOfPage: pageUrl,
  inLanguage: "fa-IR",
  datePublished: "2026-09-24",
  dateModified: "2026-09-24",
  author: { "@id": "https://khonenama.ir/#organization" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  about: [
    "معرفی کسب‌وکار دکوراسیون",
    "ثبت فروشگاه دکوراسیون",
    "جذب مشتری محلی",
    "پروفایل کسب‌وکار",
    "دایرکتوری تخصصی",
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

export default function OnlineBusinessDiscoveryGuide() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <article className="inner-page guide-page">
        <div className="shell guide-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/for-business">برای کسب‌وکارها</a><span>/</span><span>راهنمای دیده‌شدن آنلاین</span>
          </nav>

          <header className="guide-header">
            <span className="section-kicker">راهنمای صاحبان کسب‌وکار</span>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </header>

          <section className="guide-quick-answer glass-panel">
            <strong>پاسخ کوتاه</strong>
            <p>
              برای معرفی آنلاین یک فروشگاه یا متخصص دکوراسیون، اول یک پروفایل کامل و واقعی بسازید: نام، خدمت دقیق، محدوده فعالیت، توضیح قابل فهم، تصاویر واقعی و راه تماس. بعد مطمئن شوید این اطلاعات در صفحه‌ای عمومی و قابل جستجو قرار گرفته و کاربر می‌تواند از دسته یا موقعیت محلی به آن برسد.
            </p>
          </section>

          <section className="guide-content">
            <h2>۱. اول مشخص کنید دقیقاً چه چیزی را معرفی می‌کنید</h2>
            <p>
              عبارت‌هایی مثل «خدمات دکوراسیون» خیلی کلی هستند. اگر کار شما پرده زبرا، نصب لمینت، فروش موکت، طراحی داخلی یا هوشمندسازی است، همان خدمت را دقیق بنویسید. این دقت هم برای مشتری مفید است و هم به موتور جستجو کمک می‌کند موضوع صفحه را بهتر بفهمد.
            </p>

            <h2>۲. موقعیت و محدوده خدمت را واقعی ثبت کنید</h2>
            <p>
              اگر فروشگاه در کرج است یا در محدوده مشخصی خدمات نصب ارائه می‌دهد، همان را شفاف بنویسید. ثبت محله یا شهرهایی که واقعاً پوشش نمی‌دهید ممکن است کاربر نامرتبط جذب کند و اعتماد را پایین بیاورد.
            </p>

            <div className="local-intent-grid">
              <article className="local-intent-card"><Search size={20} /><h3>خدمت دقیق</h3><p>نام محصول یا خدمت را همان‌طور که مشتری جستجو می‌کند، واضح و بدون عبارت‌های مبهم توضیح دهید.</p></article>
              <article className="local-intent-card"><MapPin size={20} /><h3>محدوده فعالیت</h3><p>شهر، محله و محدوده نصب یا مراجعه حضوری را واقعی و به‌روز نگه دارید.</p></article>
              <article className="local-intent-card"><Store size={20} /><h3>اطلاعات کامل</h3><p>توضیح کسب‌وکار، ساعات یا روش تماس و خدمات را طوری ثبت کنید که کاربر قبل از تماس بداند با چه مجموعه‌ای روبه‌روست.</p></article>
              <article className="local-intent-card"><BadgeCheck size={20} /><h3>اعتماد</h3><p>تصاویر واقعی، اطلاعات ثابت و به‌روزرسانی منظم پروفایل از ادعاهای تبلیغاتی بدون مدرک ارزشمندترند.</p></article>
            </div>

            <h2>۳. عکس واقعی بهتر از متن تبلیغاتی طولانی است</h2>
            <p>
              لوگو، نمای فروشگاه، محصول و نمونه پروژه واقعی به مشتری کمک می‌کنند کیفیت و نوع کار را سریع‌تر ارزیابی کند. از تصویر ساختگی، نمونه‌کار دیگران یا اطلاعاتی که به کسب‌وکار شما مربوط نیست استفاده نکنید.
            </p>

            <h2>۴. پروفایل باید مسیر تماس روشن داشته باشد</h2>
            <p>
              کاربر بعد از دیدن اطلاعات باید بداند قدم بعد چیست: تماس، پیام، درخواست قیمت یا مراجعه. صفحه‌ای که فقط معرفی می‌کند اما مسیر اقدام مشخص ندارد، بخش مهمی از ارزش خود را از دست می‌دهد.
            </p>

            <h2>۵. دایرکتوری تخصصی را کنار کانال‌های دیگر استفاده کنید</h2>
            <p>
              پروفایل تخصصی جای سایت، شبکه اجتماعی یا Google Business Profile را در همه بازارها نمی‌گیرد؛ نقش آن این است که کسب‌وکار را در محیطی دسته‌بندی‌شده و مرتبط با نیاز کاربر قرار دهد. بهتر است اطلاعات اصلی شما در کانال‌های مختلف هماهنگ و قابل اعتماد باشند.
            </p>

            <h2>خونه‌نما در این مسیر چه کاری انجام می‌دهد؟</h2>
            <p>
              خونه‌نما روی فروشگاه‌ها و متخصصان حوزه دکوراسیون و خدمات خانه تمرکز دارد. کسب‌وکار می‌تواند اطلاعات واقعی خود را ثبت کند و پروفایل پس از تکمیل و بررسی، در صورت واجد شرایط بودن در صفحات عمومی، دسته‌بندی و جستجوی محلی نمایش داده شود.
            </p>
            <div className="guide-cta glass-panel">
              <div>
                <strong>صاحب فروشگاه یا کسب‌وکار دکوراسیون هستید؟</strong>
                <p>ثبت اولیه را رایگان شروع کنید و اطلاعات واقعی کسب‌وکارتان را کامل کنید.</p>
              </div>
              <a className="pill-button dark" href="/register-business">ثبت کسب‌وکار <ArrowUpLeft size={16} /></a>
            </div>
          </section>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">سوالات متداول</span>
                <h2>سؤال‌های صاحبان کسب‌وکار</h2>
              </div>
            </div>
            <div className="guide-faq">
              {faqs.map((faq) => (
                <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
              ))}
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  );
}
