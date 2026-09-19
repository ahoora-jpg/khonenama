import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businessPlans } from "@/lib/business-plans";
import {
  ArrowUpLeft,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ثبت کسب‌وکار در خونه‌نما | معرفی فروشگاه و خدمات دکوراسیون",
  description:
    "کسب‌وکار دکوراسیون خود را در خونه‌نما ثبت کنید؛ پروفایل حرفه‌ای، جستجوی محلی، نمونه‌کار، آمار بازدید و مسیرهای تبلیغاتی.",
  alternates: { canonical: "/for-business" },
};

const steps = [
  ["۱", "حساب و اطلاعات پایه", "شماره تماس، نام و نوع کسب‌وکار را ثبت می‌کنید."],
  ["۲", "خدمات و محدوده فعالیت", "دسته، خدمات، شهر و محله‌هایی که پوشش می‌دهید مشخص می‌شوند."],
  ["۳", "تصاویر و نمونه‌کار", "لوگو، کاور و نمونه‌کارها را برای ساخت پروفایل حرفه‌ای اضافه می‌کنید."],
  ["۴", "انتشار و رشد", "پروفایل منتشر می‌شود و بعداً می‌توانید پلن و تبلیغات را ارتقا دهید."],
] as const;

export default function ForBusinessPage() {
  return (
    <main>
      <Header />

      <section className="business-landing-hero">
        <div className="shell business-landing-grid">
          <div>
            <span className="section-kicker">خونه‌نما برای کسب‌وکارها</span>
            <h1>کسب‌وکارت را جایی معرفی کن که مشتری دنبال دکوراسیون می‌گردد.</h1>
            <p>
              پروفایل حرفه‌ای بساز، در جستجوی محلی دیده شو، نمونه‌کارت را نمایش بده
              و مسیر ارتباط با مشتری را ساده‌تر کن.
            </p>
            <div className="business-hero-actions">
              <a className="pill-button dark" href="/register-business">
                ثبت رایگان کسب‌وکار <ArrowUpLeft size={17} />
              </a>
              <a className="pill-button" href="#plans">دیدن پلن‌ها</a>
            </div>
            <div className="business-hero-proof">
              <span><ShieldCheck size={16} /> شروع رایگان</span>
              <span><MapPin size={16} /> جستجوی محلی</span>
              <span><BadgeCheck size={16} /> امکان تأیید کسب‌وکار</span>
            </div>
          </div>

          <div className="business-landing-visual glass-panel">
            <div className="business-preview-card">
              <span className="status-pill">نمونه پروفایل</span>
              <div className="business-preview-cover" />
              <div className="business-preview-body">
                <strong>پرده‌سرای نمونه کرج</strong>
                <small>پرده زبرا، شید، اندازه‌گیری و نصب</small>
                <div>
                  <span><Search size={14} /> دیده‌شدن در جستجو</span>
                  <span><MessageCircle size={14} /> دریافت درخواست مشتری</span>
                </div>
              </div>
            </div>
            <div className="business-floating-stat">
              <BarChart3 size={20} />
              <span><strong>آمار واقعی</strong><small>بازدید، تماس و درخواست</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="section business-benefits">
        <div className="shell">
          <div className="section-heading premium-heading">
            <div>
              <span className="section-kicker">چرا خونه‌نما؟</span>
              <h2>فقط یک آگهی نیست؛ یک ویترین حرفه‌ای برای کسب‌وکار توست.</h2>
            </div>
          </div>

          <div className="business-benefit-grid">
            <article><Store size={22} /><h3>پروفایل حرفه‌ای</h3><p>اطلاعات، خدمات، تماس، آدرس، تصاویر و نمونه‌کار در یک صفحه اختصاصی.</p></article>
            <article><MapPin size={22} /><h3>جستجوی محلی</h3><p>نمایش بر اساس شهر، محله، دسته و نوع خدمت.</p></article>
            <article><Camera size={22} /><h3>نمونه‌کار واقعی</h3><p>تصاویر پروژه‌ها و محصولات، به‌جای توضیح خشک و طولانی.</p></article>
            <article><BarChart3 size={22} /><h3>آمار عملکرد</h3><p>در پلن‌های حرفه‌ای، بازدید، کلیک تماس و درخواست مشتری را دنبال می‌کنید.</p></article>
          </div>
        </div>
      </section>

      <section className="section business-onboarding-section">
        <div className="shell">
          <div className="section-heading premium-heading">
            <div>
              <span className="section-kicker">فرآیند ثبت</span>
              <h2>چهار مرحله تا داشتن پروفایل در خونه‌نما</h2>
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
            <p>قیمت پلن‌های پولی قبل از فعال‌شدن پرداخت عمومی نهایی می‌شود.</p>
          </div>

          <div className="business-plan-grid">
            {businessPlans.map((plan) => (
              <article className={"business-plan-card " + (plan.code === "pro" ? "is-highlighted" : "")} key={plan.code}>
                <span className="business-plan-badge">{plan.badge}</span>
                <h3>{plan.name}</h3>
                <strong>{plan.priceLabel}</strong>
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

      <section className="section business-faq-section">
        <div className="shell business-faq-layout">
          <div>
            <span className="section-kicker">سوالات رایج</span>
            <h2>قبل از ثبت کسب‌وکار</h2>
          </div>
          <div className="guide-faq">
            <details><summary>ثبت کسب‌وکار رایگان است؟</summary><p>بله. پلن پایه برای ساخت و انتشار پروفایل اولیه رایگان است.</p></details>
            <details><summary>چطور نشان تأییدشده می‌گیرم؟</summary><p>تأیید شماره تماس مرحله پایه است و برای نشان تأییدشده، مدارک و اطلاعات کسب‌وکار بررسی می‌شوند.</p></details>
            <details><summary>تبلیغ پولی روی رتبه طبیعی اثر می‌گذارد؟</summary><p>جایگاه‌های پولی با برچسب «ویژه» یا «اسپانسر» مشخص می‌شوند و از اعتبار تأیید کسب‌وکار جدا هستند.</p></details>
            <details><summary>آیا چند نفر می‌توانند یک پروفایل را مدیریت کنند؟</summary><p>بله؛ ساختار پنل برای Owner، Manager و Staff طراحی شده و در فاز اتصال احراز هویت فعال می‌شود.</p></details>
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
