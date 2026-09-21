import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BadgeCheck, MapPin, Search, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره خونه‌نما | مرجع تخصصی دکوراسیون و خدمات خانه",
  description: "خونه‌نما برای پیدا کردن، مقایسه و ارتباط مستقیم با فروشگاه‌ها و متخصصان دکوراسیون و خانه هوشمند ساخته شده است.",
  alternates: { canonical: "/about" },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://khonenama.ir/about#page",
  url: "https://khonenama.ir/about",
  name: "درباره خونه‌نما",
  inLanguage: "fa-IR",
  mainEntity: { "@id": "https://khonenama.ir/#organization" },
  isPartOf: { "@id": "https://khonenama.ir/#website" },
};

export default function AboutPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <Header />
      <section className="inner-page legal-page">
        <div className="shell legal-shell">
          <header className="legal-hero glass-panel">
            <span className="section-kicker">درباره خونه‌نما</span>
            <h1>پیدا کردن گزینه مناسب برای خانه باید ساده‌تر و شفاف‌تر باشد.</h1>
            <p>
              خونه‌نما یک مرجع تخصصی برای دکوراسیون، متریال، اجرای داخلی و خانه هوشمند است؛
              جایی برای دیدن نمونه‌کار، مقایسه خدمات و ارتباط مستقیم با کسب‌وکار.
            </p>
          </header>

          <article className="legal-content glass-panel">
            <h2>خونه‌نما چه کاری انجام می‌دهد؟</h2>
            <p>
              کاربر می‌تواند بر اساس دسته، شهر و محله جستجو کند، پروفایل کسب‌وکارها را ببیند،
              خدمات و نمونه‌کارها را مقایسه کند و برای همان کسب‌وکار درخواست قیمت خصوصی بفرستد.
            </p>

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

            <h2>پروفایل نمونه یعنی چه؟</h2>
            <p>
              بعضی پروفایل‌ها با برچسب «نمونه نمایشی» فقط برای نشان دادن ساختار سایت ساخته شده‌اند.
              این نمونه‌ها مشتری، امتیاز یا ادعای فعالیت واقعی ندارند و با کسب‌وکار ثبت‌شده اشتباه گرفته نمی‌شوند.
            </p>

            <h2>محتوای خونه‌نما چگونه نوشته و به‌روزرسانی می‌شود؟</h2>
            <p>
              راهنماهای خونه‌نما برای پاسخ روشن به سوال‌های انتخاب، خرید، نصب و نگهداری نوشته می‌شوند. در مطالب آموزشی از رتبه‌بندی ساختگی، قیمت قطعی بدون منبع و ادعای تجربه مشتری استفاده نمی‌کنیم. جزئیات روش تولید و بازبینی محتوا در صفحه سیاست تحریریه منتشر شده است.
            </p>
            <p><a href="/editorial-policy">سیاست تحریریه و اصول محتوایی خونه‌نما</a></p>

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
