import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "راهنما و پشتیبانی | خونه‌نما",
  description: "مسیرهای سریع برای ثبت کسب‌وکار، ورود پنل، پیگیری درخواست قیمت و بازیابی رمز در خونه‌نما.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <main>
      <Header />
      <section className="inner-page legal-page">
        <div className="shell legal-shell">
          <header className="legal-hero glass-panel">
            <span className="section-kicker">راهنما</span>
            <h1>از کجا ادامه بدهم؟</h1>
            <p>مسیر مناسب را انتخاب کنید؛ اطلاعات خصوصی درخواست و پنل فقط در مسیر امن خودشان نمایش داده می‌شوند.</p>
          </header>

          <article className="legal-content glass-panel">
            <h2>می‌خواهم کسب‌وکارم را ثبت کنم</h2>
            <p>ثبت اولیه رایگان است و بعد از تکمیل اطلاعات، پروفایل عمومی به‌صورت خودکار ساخته می‌شود.</p>
            <a className="pill-button dark" href="/register-business">ثبت کسب‌وکار</a>

            <h2>قبلاً ثبت‌نام کرده‌ام</h2>
            <p>برای مدیریت اطلاعات، گالری، درخواست‌های مشتری، نظرها و آمار وارد پنل کسب‌وکار شوید.</p>
            <a className="pill-button" href="/business/login">ورود کسب‌وکار</a>

            <h2>رمز عبور را فراموش کرده‌ام</h2>
            <p>از مسیر بازیابی رمز استفاده کنید. تا اتصال ارسال ایمیل و پیامک نهایی، وضعیت این قابلیت در همان صفحه اعلام می‌شود.</p>
            <a className="pill-button" href="/business/forgot-password">بازیابی رمز</a>

            <h2>درخواست قیمت ثبت کرده‌ام</h2>
            <p>با کد درخواست و همان شماره همراه، پاسخ کسب‌وکار را به‌صورت خصوصی پیگیری کنید.</p>
            <a className="pill-button" href="/request-status">پیگیری درخواست</a>

            <h2>می‌خواهم درباره حریم خصوصی بدانم</h2>
            <p>درخواست مشتری، شماره تماس و پیشنهاد قیمت روی پروفایل عمومی نمایش داده نمی‌شوند.</p>
            <div className="legal-cta-row">
              <a className="pill-button" href="/privacy">حریم خصوصی</a>
              <a className="pill-button" href="/terms">قوانین استفاده</a>
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
