import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LaunchOfferBanner from "@/components/LaunchOfferBanner";
import SellerAcquisitionTracker from "@/components/SellerAcquisitionTracker";
import { businessPlans } from "@/lib/business-plans";
import { PublicPlanPrice } from "@/components/RegistrationOffers";
import { businessDiscoveryAnswers } from "@/lib/ai-search-content";
import {
  ArrowUpLeft,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Camera,
  Check,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

const pageUrl = "https://khonenama.ir/for-business";
const pageTitle = "ثبت رایگان غرفه و فروشگاه دکوراسیون | خونه‌نما";
const pageDescription =
  "ثبت رایگان غرفه برای فروشگاه، تولیدکننده و نصاب دکوراسیون؛ راهنمای معرفی کسب‌وکار در کرج، مقایسه پلن‌ها، نمونه‌کار و مراحل انتشار در خونه‌نما.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: "خونه نما",
    locale: "fa_IR",
    type: "website",
  },
};

const steps = [
  ["۱", "حساب و اطلاعات پایه", "شماره تماس، نام و نوع کسب‌وکار را ثبت می‌کنید."],
  ["۲", "خدمات و محدوده فعالیت", "دسته، خدمات، شهر و محله‌هایی که پوشش می‌دهید مشخص می‌شوند."],
  ["۳", "تصاویر و نمونه‌کار", "لوگو، کاور و تصاویر واقعی را برای کامل‌کردن پروفایل اضافه می‌کنید."],
  ["۴", "بررسی و انتشار", "پس از تکمیل و بررسی، پروفایل واجد شرایط می‌تواند در صفحات عمومی منتشر شود."],
] as const;

const businessFaqs = [
  { question: "ثبت کسب‌وکار رایگان است؟", answer: "بله. پلن پایه برای ساخت و انتشار پروفایل اولیه رایگان است." },
  { question: "چطور نشان تأییدشده می‌گیرم؟", answer: "ثبت حساب یا خرید اشتراک به‌تنهایی نشان تأیید کسب‌وکار نیست. وضعیت و مراحل بررسی اطلاعات کسب‌وکار را در پنل پیگیری کنید؛ تکمیل فرم به معنی تأیید مالکیت شماره یا صدور خودکار نشان نیست." },
  { question: "خرید اشتراک رتبه گوگل یا مشتری را تضمین می‌کند؟", answer: "خیر. اشتراک ظرفیت و امکانات معرفی غرفه را تغییر می‌دهد؛ نشانه کیفیت کار یا تأیید کسب‌وکار نیست و رتبه گوگل، تعداد تماس یا فروش را تضمین نمی‌کند." },
  { question: "برای ثبت فروشگاه پرده یا معرفی نصاب در کرج چه چیزی لازم است؟", answer: "نام واقعی، نوع فعالیت، خدمات دقیق، شهر و محدوده واقعی کار، راه تماس و تصاویر متعلق به خودتان را ثبت کنید. فروشگاه پرده، تولیدکننده، دوزنده و نصاب می‌توانند نوع فعالیت واقعی خود را معرفی کنند؛ شهر کرج را فقط اگر واقعاً در آن فعالیت یا خدمت دارید انتخاب کنید." },
  { question: "آیا ثبت رایگان فروشگاه به معنی ساخت فروشگاه با پرداخت آنلاین است؟", answer: "خیر. غرفه خونه‌نما صفحه معرفی کسب‌وکار، خدمات، نمونه‌کار و راه ارتباط یا درخواست قیمت است. ثبت غرفه به‌خودی‌خود سبد خرید، انبارداری یا درگاه فروش محصولات شما ایجاد نمی‌کند." },
  { question: "برای ساخت پروفایل چه اطلاعاتی لازم است؟", answer: "نام واقعی کسب‌وکار، دسته و خدمات، شهر و محدوده فعالیت، شماره تماس و توضیح روشن پایه کار هستند؛ تصاویر واقعی هم به کامل‌تر شدن پروفایل کمک می‌کنند." },
] as const;

const webpageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": pageUrl + "#webpage",
  url: pageUrl,
  name: pageTitle,
  description: pageDescription,
  inLanguage: "fa-IR",
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  about: [
    { "@type": "Thing", name: "معرفی کسب‌وکار دکوراسیون" },
    { "@type": "Thing", name: "ثبت فروشگاه و متخصص خدمات خانه" },
    { "@type": "Thing", name: "جستجوی محلی کسب‌وکار" },
    { "@type": "Thing", name: "دیده‌شدن آنلاین کسب‌وکار محلی" },
  ],
  hasPart: {
    "@type": "Article",
    "@id": "https://khonenama.ir/for-business/online-discovery-guide#article",
    url: "https://khonenama.ir/for-business/online-discovery-guide",
    headline: "چطور کسب‌وکار دکوراسیون را آنلاین معرفی کنیم؟",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خونه نما", item: "https://khonenama.ir/" },
    { "@type": "ListItem", position: 2, name: "برای کسب‌وکارها", item: pageUrl },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [...businessDiscoveryAnswers, ...businessFaqs].map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function ForBusinessPage() {
  return (
    <main>
      <SellerAcquisitionTracker page="landing" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <div className="shell"><LaunchOfferBanner /></div>

      <section className="business-landing-hero">
        <div className="shell business-landing-grid">
          <div>
            <span className="section-kicker">خونه نما برای کسب‌وکارها</span>
            <h1>ثبت رایگان غرفه برای فروشگاه و متخصص دکوراسیون</h1>
            <p>
              پروفایل حرفه‌ای بساز، در دسته و جستجوی محلی دیده شو، نمونه‌کارت را نمایش بده
              و مسیر ارتباط با مشتری را ساده‌تر کن.
            </p>
            <div className="business-hero-actions">
              <a className="pill-button dark" href="/register-business">
                ثبت رایگان غرفه <ArrowUpLeft size={17} />
              </a>
              <a className="pill-button" href="#plans">دیدن پلن‌ها</a>
              <a className="pill-button" href="#karaj">راهنمای فروشندگان کرج</a>
            </div>
            <div className="business-hero-proof">
              <span><ShieldCheck size={16} /> شروع رایگان</span>
              <span><MapPin size={16} /> جستجوی محلی</span>
              <span><BadgeCheck size={16} /> امکان تأیید کسب‌وکار</span>
            </div>
          </div>

          <div className="business-landing-visual glass-panel">
            <div className="business-preview-card">
              <span className="status-pill">نمای ساختار پروفایل</span>
              <div className="business-preview-cover" />
              <div className="business-preview-body">
                <strong>نام کسب‌وکار شما</strong>
                <small>دسته، خدمات و محدوده فعالیت</small>
                <div>
                  <span><Search size={14} /> دیده‌شدن در دسته و جستجوی محلی</span>
                  <span><MessageCircle size={14} /> مسیر دریافت درخواست مشتری</span>
                </div>
              </div>
            </div>
            <div className="business-floating-stat">
              <BarChart3 size={20} />
              <span><strong>آمار پنل</strong><small>تعامل‌های ثبت‌شده با پروفایل</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="section business-benefits" id="karaj" aria-labelledby="karaj-seller-title">
        <div className="shell">
          <h2 id="karaj-seller-title">ثبت فروشگاه و معرفی نصاب دکوراسیون در کرج</h2>
          <p>اگر صاحب پرده‌فروشی، فروشگاه کفپوش، موکت یا کاغذ دیواری در کرج هستید، تولید می‌کنید یا خدمات دوخت، نصب، طراحی، نورپردازی و خانه هوشمند ارائه می‌دهید، غرفه را با خدمات و محدوده واقعی خود بسازید. نشانی محل مراجعه را از محله‌هایی که برای نصب یا بازدید پوشش می‌دهید جدا کنید؛ بدون محل مراجعه نیز می‌توانید نوع فعالیت مستقل خود را دقیق توضیح دهید.</p>
          <div className="local-intent-grid">
            <article className="local-intent-card"><h3>ثبت فروشگاه پرده و خدمات دوخت و نصب</h3><p>فروش پارچه یا پرده آماده را از اندازه‌گیری، دوخت، نصب و تعمیر جدا ثبت کنید. در توضیح نمونه‌کار، نوع پرده، یراق و کاری را که خودتان انجام داده‌اید بنویسید؛ نام محله به‌تنهایی جای توضیح خدمت را نمی‌گیرد.</p><a href="/category/curtain">مشاهده دسته پرده و متعلقات</a></article>
            <article className="local-intent-card"><h3>معرفی فروشگاه کفپوش، موکت و دیوارپوش</h3><p>نوع متریال و خدمات واقعی مثل زیرسازی، نصب، قرنیز، برش و دوردوزی را انتخاب کنید. عکس متعلق به خودتان و توضیح کاربرد محصول برای مشتری از تکرار عبارت «بهترین فروشگاه کرج» مفیدتر است.</p><a href="/for-business/online-discovery-guide#profile-checklist">چک‌لیست معرفی غرفه</a></article>
            <article className="local-intent-card"><h3>معرفی طراح، مجری و متخصص مستقل</h3><p>طراحی را از اجرا و نظارت تفکیک کنید. برای خانه هوشمند و نورپردازی، نصب، تنظیمات و خدمات پشتیبانی واقعی را بنویسید؛ محدوده خدمت و روش بازدید را پیش از دریافت درخواست روشن کنید.</p><a href="/for-business/online-discovery-guide#project-photos">روش معرفی نمونه‌کار</a></article>
          </div>
          <p>تمرکز محتوای محلی این مرحله کرج است؛ ثبت‌نام برای کسب‌وکارهای تمام ایران باز می‌ماند. شرایط هر پیشنهاد آغاز فعالیت فقط در صورت نمایش فعال آن در همین صفحه معتبر است؛ هدیه یا کمپین مخصوص کرج را بدون اعلام شرایط فرض نکنید.</p>
          <a className="pill-button dark" href="/register-business">ثبت رایگان غرفه</a>
        </div>
      </section>

      <section className="section business-benefits">
        <div className="shell">
          <div className="section-heading premium-heading">
            <div>
              <span className="section-kicker">پاسخ به سوال صاحبان کسب‌وکار</span>
              <h2>کجا و چطور کسب‌وکار دکوراسیون را آنلاین معرفی کنیم؟</h2>
            </div>
          </div>
          <div className="local-intent-grid">
            {businessDiscoveryAnswers.map((item) => (
              <article className="local-intent-card" key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="category-tool-card glass-panel" aria-label="راهنمای معرفی آنلاین کسب‌وکار">
            <span><BookOpen size={20} /></span>
            <div>
              <h2>راهنمای عملی دیده‌شدن آنلاین برای فروشگاه و متخصص دکوراسیون</h2>
              <p>از انتخاب دسته و محدوده فعالیت تا تصاویر واقعی، اطلاعات پروفایل، مسیر تماس و حضور در جستجوی محلی را مرحله‌به‌مرحله بررسی کنید.</p>
            </div>
            <a href="/for-business/online-discovery-guide">مطالعه راهنمای کامل <ArrowUpLeft size={14} /></a>
          </div>
        </div>
      </section>

      <section className="section business-benefits">
        <div className="shell">
          <div className="section-heading premium-heading">
            <div>
              <span className="section-kicker">چرا خونه نما؟</span>
              <h2>فقط یک آگهی نیست؛ یک ویترین حرفه‌ای برای کسب‌وکار توست.</h2>
            </div>
          </div>

          <div className="business-benefit-grid">
            <article><Store size={22} /><h3>پروفایل حرفه‌ای</h3><p>اطلاعات، خدمات، تماس، آدرس، تصاویر و نمونه‌کار در یک صفحه اختصاصی.</p></article>
            <article><MapPin size={22} /><h3>جستجوی محلی</h3><p>نمایش بر اساس شهر، محله، دسته و نوع خدمت برای پروفایل‌های منتشرشده.</p></article>
            <article><Camera size={22} /><h3>نمونه‌کار واقعی</h3><p>تصاویر واقعی پروژه‌ها و محصولات؛ در آلبوم‌ها، خدمت انجام‌شده، متریال و محدوده پروژه را توضیح می‌دهید.</p></article>
            <article><BarChart3 size={22} /><h3>آمار عملکرد</h3><p>تعامل‌های ثبت‌شده، پیشنهادهای ارسال‌شده و انتخاب‌شده و زمان پاسخ اولیه در پنل قابل پیگیری‌اند؛ این آمار اثبات فروش یا انجام سفارش نیست.</p></article>
          </div>
        </div>
      </section>

      <section className="section business-onboarding-section" id="registration-steps">
        <div className="shell">
          <div className="section-heading premium-heading">
            <div>
              <span className="section-kicker">فرآیند ثبت</span>
              <h2>مسیر ساخت و انتشار پروفایل در خونه نما</h2>
            </div>
          </div>

          <div className="business-step-grid">
            {steps.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section business-plans-section" id="plans">
        <div className="shell">
          <div className="section-heading premium-heading">
            <div>
              <span className="section-kicker">پلن‌ها</span>
              <h2>رایگان شروع کن؛ وقتی نیاز داشتی ارتقا بده.</h2>
            </div>
            <p>تعرفه و ظرفیت فعلی هر پلن در ادامه آمده است. ثبت‌نام با پایه رایگان شروع می‌شود؛ پرداخت عمومی و خرید پلن پولی فعلاً فعال نیست. خرید اشتراک نشانه کیفیت یا تضمین جذب مشتری نیست.</p>
          </div>

          <div className="business-plan-grid">
            {businessPlans.map((plan) => (
              <article className={"business-plan-card " + (plan.code === "pro" ? "is-highlighted" : "")} key={plan.code}>
                <span className="business-plan-badge">{plan.badge}</span>
                <h3>{plan.name}</h3>
                <strong><PublicPlanPrice code={plan.code} normal={plan.priceLabel} /></strong>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}><Check size={15} /> {feature}</li>
                  ))}
                </ul>
                <a className={plan.code === "free" ? "pill-button dark" : "pill-button"} href="/register-business">
                  {plan.code === "free" ? "شروع رایگان" : "ساخت پروفایل و ادامه"}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section business-faq-section" id="seller-faq">
        <div className="shell business-faq-layout">
          <div>
            <span className="section-kicker">سوالات رایج</span>
            <h2>قبل از ثبت کسب‌وکار</h2>
          </div>
          <div className="guide-faq">
            {businessFaqs.map((item) => (
              <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="section business-final-cta">
        <div className="shell business-final-card glass-panel">
          <div>
            <span className="section-kicker">شروع از همین حالا</span>
            <h2>پروفایل کسب‌وکارت را بساز.</h2>
            <p>ثبت اولیه چند مرحله کوتاه دارد و با پلن پایه رایگان شروع می‌شود.</p>
          </div>
          <a className="pill-button dark" href="/register-business">
            ثبت کسب‌وکار <Users size={17} />
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
