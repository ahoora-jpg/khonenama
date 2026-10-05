import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const pageUrl = "https://khonenama.ir/help";
const pageTitle = "راهنما و پشتیبانی | خونه نما";
const pageDescription = "راهنمای مشتری خونه نما؛ انتخاب و مقایسه غرفه‌های دکوراسیون، پیگیری خصوصی پیشنهاد قیمت، نظر مشتری و پشتیبانی با کد محرمانه.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: pageUrl },
};

const faqItems = [
  {
    question: "چطور کسب‌وکارم را در خونه نما ثبت کنم؟",
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
            <h1>راهنمای مشتری و کسب‌وکار در خونه نما</h1>
            <p>مسیر مناسب را انتخاب کنید؛ اطلاعات خصوصی درخواست و پنل فقط در مسیر امن خودشان نمایش داده می‌شوند.</p>
          </header>

          <article className="legal-content glass-panel">
            <h2>چطور فروشنده یا مجری مرتبط را انتخاب کنم؟</h2>
            <p>از دسته مناسب و شهر یا محدوده واقعی پروژه شروع کنید: پرده، کفپوش و پارکت، موکت، کاغذ دیواری و دیوارپوش، طراحی داخلی یا خانه هوشمند. خدمات، محدوده فعالیت، تصاویر و توضیح پروژه‌های هر غرفه را بررسی کنید. <a href="/magazine">راهنماهای دکوراسیون</a> و <a href="/tools">ابزارهای محاسبه</a> به آماده‌شدن قبل از تماس کمک می‌کنند.</p>
            <p>حداکثر سه غرفه را مقایسه کنید. ذخیره غرفه‌ها فعلاً روی همان دستگاه انجام می‌شود. خرید اشتراک نشان کیفیت خدمت نیست؛ نشان تأیید، امتیاز مشتری و جایگاه تبلیغاتی را جدا بررسی کنید.</p>
            <h2>نظر مشتری و پاسخ صاحب غرفه</h2>
            <p>نظرهای منتشرشده و پاسخ عمومی صاحب غرفه در پروفایل قابل مشاهده‌اند. برای نظر نامناسب از گزینه گزارش استفاده کنید. مدیر می‌تواند پاسخ نامناسب صاحب غرفه را پنهان کند و نظر مشتری باقی بماند. «تعامل ثبت‌شده» اثبات انجام سفارش نیست.</p>
            <h2>می‌خواهم کسب‌وکارم را معرفی کنم</h2>
            <p>
              اگر فروشگاه یا کسب‌وکار حوزه پرده، کفپوش، موکت، کاغذ دیواری، طراحی داخلی یا خانه هوشمند دارید، ابتدا راهنمای حضور کسب‌وکار در خونه نما را ببینید. نام، خدمات، شهر و محدوده فعالیت، توضیح کسب‌وکار و تصاویر عمومی باید واقعی و مربوط به همان مجموعه باشند.
            </p>
            <div className="legal-cta-row">
              <a className="pill-button" href="/for-business">درباره خونه نما برای کسب‌وکارها</a>
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
              کد درخواست و همان شماره همراهی را که هنگام ثبت درخواست استفاده کرده‌اید نگه دارید. پاسخ و جزئیات پیشنهاد کسب‌وکار از مسیر پیگیری درخواست نمایش داده می‌شود و روی پروفایل عمومی کسب‌وکار منتشر نمی‌شود. از همین مسیر می‌توانید پیشنهاد را انتخاب یا رد کنید؛ انتخاب پیشنهاد و کلیک تماس به معنی فروش قطعی یا انجام پروژه نیست.
            </p>
            <a className="pill-button" href="/request-status">پیگیری درخواست</a>

            <h2>می‌خواهم قبل از تماس آماده‌تر باشم</h2>
            <p>
              اگر درباره متراژ یا دامنه پروژه مطمئن نیستید، ابزارهای رایگان خونه نما برای برآورد تعداد رول کاغذ دیواری، متراژ پارچه پرده، موکت، تعداد بسته کفپوش و محدوده اولیه خانه هوشمند در دسترس هستند. نتیجه ابزار برآورد اولیه است و برای سفارش نهایی باید اندازه‌گیری یا مشخصات پروژه تأیید شود.
            </p>
            <a className="pill-button" href="/tools">مشاهده ابزارها</a>

            <h2>پشتیبانی و پیگیری محرمانه</h2>
            <p>برای ارسال مشکل از <a href="/support">پشتیبانی خونه نما</a> استفاده کنید و کد محرمانه پیگیری را نگه دارید. این کد، درخواست‌ها و پیشنهادهای قیمت خصوصی را در نظر، تصاویر یا توضیح عمومی غرفه منتشر نکنید.</p>
            <h2>کمپین تخفیف را چگونه بررسی کنم؟</h2>
            <p>کمپین مشترک پس از موافقت همکاران و تأیید مدیر فقط در بازه فعال نمایش داده می‌شود. تخفیف، اعلام غرفه است و خودکار در پرداخت اعمال نمی‌شود؛ شرایط، بازه و دامنه خدمت را پیش از توافق با کسب‌وکار بررسی کنید.</p>
            <p><a href="/download-app">دانلود نسخه اندروید خونه نما</a></p>
            <h2>حریم خصوصی و قوانین</h2>
            <p>
              درخواست مشتری، شماره تماس خصوصی و پیشنهاد قیمت روی پروفایل عمومی نمایش داده نمی‌شوند. برای جزئیات بیشتر درباره اطلاعات عمومی و خصوصی، نحوه استفاده از رسانه‌ها و قواعد انتشار پروفایل، صفحات حریم خصوصی و قوانین استفاده را بخوانید.
            </p>
            <div className="legal-cta-row">
              <a className="pill-button" href="/privacy">حریم خصوصی</a>
              <a className="pill-button" href="/account-deletion">حذف حساب</a>
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
