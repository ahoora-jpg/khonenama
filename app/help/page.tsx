import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const pageUrl = "https://khonenama.ir/help";
const pageTitle = "راهنما و پشتیبانی | خونه‌نما";
const pageDescription = "راهنمای ثبت کسب‌وکار، ورود پنل، پیگیری درخواست، حریم خصوصی و مسیرهای پشتیبانی خونه‌نما.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: pageUrl },
};

const faqItems = [
  {
    question: "چطور کسب‌وکارم را در خونه‌نما ثبت کنم؟",
    answer: "از صفحه «برای کسب‌وکارها» درباره نحوه حضور و اطلاعات لازم بخوانید و سپس ثبت اولیه را از مسیر ثبت کسب‌وکار شروع کنید. اطلاعات عمومی باید واقعی و مربوط به همان کسب‌وکار باشد.",
  },
  {
    question: "چطور پاسخ درخواست قیمت را ببینم؟",
    answer: "برای مشاهده پاسخ خصوصی، از صفحه پیگیری درخواست با همان کد درخواست و شماره همراهی استفاده کنید که هنگام ثبت درخواست وارد کرده‌اید.",
  },
  {
    question: "اطلاعات خصوصی مشتری در صفحه عمومی نمایش داده می‌شود؟",
    answer: "خیر. شماره همراه، متن خصوصی درخواست و پیشنهاد قیمت جزو اطلاعات عمومی پروفایل کسب‌وکار نیستند و جزئیات این موضوع در صفحه حریم خصوصی توضیح داده شده است.",
  },
];

const pageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": pageUrl + "#webpage",
  url: pageUrl,
  name: pageTitle,
  description: pageDescription,
  inLanguage: "fa-IR",
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  about: { "@id": "https://khonenama.ir/#organization" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function HelpPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <section className="inner-page legal-page">
        <div className="shell legal-shell">
          <header className="legal-hero glass-panel">
            <span className="section-kicker">راهنما</span>
            <h1>از کجا ادامه بدهم؟</h1>
            <p>مسیر مناسب را انتخاب کنید؛ اطلاعات خصوصی درخواست و پنل فقط در مسیر امن خودشان نمایش داده می‌شوند.</p>
          </header>

          <article className="legal-content glass-panel">
            <h2>می‌خواهم کسب‌وکارم را معرفی کنم</h2>
            <p>
              اگر فروشگاه یا کسب‌وکار حوزه پرده، کفپوش، موکت، کاغذ دیواری، طراحی داخلی یا خانه هوشمند دارید، ابتدا راهنمای حضور کسب‌وکار در خونه‌نما را ببینید. نام، خدمات، شهر و محدوده فعالیت، توضیح کسب‌وکار و تصاویر عمومی باید واقعی و مربوط به همان مجموعه باشند.
            </p>
            <div className="legal-cta-row">
              <a className="pill-button" href="/for-business">درباره خونه‌نما برای کسب‌وکارها</a>
              <a className="pill-button" href="/for-business/online-discovery-guide">راهنمای دیده‌شدن آنلاین</a>
              <a className="pill-button dark" href="/register-business">ثبت کسب‌وکار</a>
            </div>

            <h2>قبلاً ثبت‌نام کرده‌ام</h2>
            <p>
              برای مدیریت اطلاعات عمومی، گالری، درخواست‌های مشتری و وضعیت حساب وارد پنل کسب‌وکار شوید. اطلاعات پنل و درخواست‌های خصوصی برای موتور جستجو طراحی نشده‌اند و از صفحات عمومی کسب‌وکار جدا هستند.
            </p>
            <a className="pill-button" href="/business/login">ورود کسب‌وکار</a>

            <h2>رمز عبور را فراموش کرده‌ام</h2>
            <p>
              از مسیر بازیابی رمز استفاده کنید. تا زمانی که بازیابی خودکار پیامکی یا ایمیلی برای حساب شما فعال نباشد، توضیح روش پشتیبانی در همان صفحه نمایش داده می‌شود. اطلاعات ورود را در صفحات عمومی یا فرم‌های نامرتبط ارسال نکنید.
            </p>
            <a className="pill-button" href="/business/forgot-password">بازیابی رمز</a>

            <h2>درخواست قیمت ثبت کرده‌ام</h2>
            <p>
              کد درخواست و همان شماره همراهی را که هنگام ثبت درخواست استفاده کرده‌اید نگه دارید. پاسخ و جزئیات پیشنهاد کسب‌وکار از مسیر پیگیری درخواست نمایش داده می‌شود و روی پروفایل عمومی کسب‌وکار منتشر نمی‌شود.
            </p>
            <a className="pill-button" href="/request-status">پیگیری درخواست</a>

            <h2>می‌خواهم قبل از تماس آماده‌تر باشم</h2>
            <p>
              اگر درباره متراژ یا دامنه پروژه مطمئن نیستید، ابزارهای رایگان خونه‌نما برای برآورد تعداد رول کاغذ دیواری، متراژ پارچه پرده، موکت و Scope اولیه خانه هوشمند در دسترس هستند. نتیجه ابزار برآورد اولیه است و برای سفارش نهایی باید اندازه‌گیری یا مشخصات پروژه تأیید شود.
            </p>
            <a className="pill-button" href="/tools">مشاهده ابزارها</a>

            <h2>حریم خصوصی و قوانین</h2>
            <p>
              درخواست مشتری، شماره تماس خصوصی و پیشنهاد قیمت روی پروفایل عمومی نمایش داده نمی‌شوند. برای جزئیات بیشتر درباره اطلاعات عمومی و خصوصی، نحوه استفاده از رسانه‌ها و قواعد انتشار پروفایل، صفحات حریم خصوصی و قوانین استفاده را بخوانید.
            </p>
            <div className="legal-cta-row">
              <a className="pill-button" href="/privacy">حریم خصوصی</a>
              <a className="pill-button" href="/terms">قوانین استفاده</a>
              <a className="pill-button" href="/editorial-policy">سیاست تحریریه</a>
            </div>

            <h2>سؤال‌های پرتکرار</h2>
            <div className="guide-faq">
              {faqItems.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
