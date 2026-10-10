import type { Metadata } from "next";
import { businessPlans } from "@/lib/business-plans";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessOnboardingWizard from "@/components/BusinessOnboardingWizard";
import LaunchOfferBanner from "@/components/LaunchOfferBanner";
import { BadgeCheck, MapPin, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "ثبت کسب‌وکار | ساخت پروفایل",
  description:
    "کسب‌وکار دکوراسیون خود را مرحله‌به‌مرحله ثبت کنید؛ اطلاعات، خدمات، محدوده فعالیت و نمونه‌کار را برای ساخت پروفایل خونه نما تکمیل کنید.",
  alternates: { canonical: "/register-business" },
  robots: { index: false, follow: true },
};

export default function RegisterBusinessPage() {
  return (
    <main>
      <Header />

      <section className="inner-page register-page onboarding-page">
        <div className="shell">
          <LaunchOfferBanner />
          <div className="onboarding-page-heading">
            <div>
              <span className="section-kicker">ثبت کسب‌وکار</span>
              <h1>پروفایل کسب‌وکارت را بساز.</h1>
              <p>
                اطلاعات واقعی را مرحله‌به‌مرحله وارد کن؛ ثبت اولیه رایگان است. ذخیره اطلاعات با انتشار غرفه فرق دارد و نمایش عمومی پس از تکمیل و بررسی انجام می‌شود.
              </p>
            </div>
            <a className="text-link-arrow" href="/for-business">درباره خونه نما برای کسب‌وکارها</a>
          </div>

          <div className="onboarding-trust-strip">
            <span><Store size={17} /> پروفایل اختصاصی</span>
            <span><MapPin size={17} /> جستجوی محلی</span>
            <span><ShieldCheck size={17} /> تأیید اطلاعات</span>
            <span><BadgeCheck size={17} /> مسیر دریافت نشان تأییدشده</span>
          </div>

          <details className="glass-panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
            <summary>پیش از شروع ثبت‌نام چه اطلاعاتی آماده کنم؟</summary>
            <p>نام و توضیح واقعی کسب‌وکار، دسته و خدمات، شهر و محدوده فعالیت، راه تماس عمومی و تصاویر متعلق به خودتان را آماده کنید. مشخصات و عکس خصوصی مشتری را در غرفه عمومی وارد نکنید.</p>
            <a href="/for-business/online-discovery-guide#profile-checklist">چک‌لیست کامل آماده‌سازی غرفه در شش حوزه</a>
          </details>
          <details className="glass-panel" style={{padding:"1rem",marginBottom:"1rem"}} open>
            <summary>مقایسه ظرفیت و هزینه اشتراک‌ها</summary>
            <div className="registration-plan-images">{businessPlans.map((plan,index)=><article key={plan.code}><img src={`/images/plans/${plan.code}.webp`} width={1000} height={1000} alt={`پلن ${plan.name}: ${[10,30,70][index]} عکس و ${[0,2,5][index]} ویدیو؛ ${plan.priceLabel}${index ? `؛ سالانه ${index===1?'۲ میلیون و ۵۰۰ هزار':'۳ میلیون و ۵۰۰ هزار'} تومان` : ''}`} loading="lazy" /><h2>{plan.name}</h2><p>{plan.priceLabel}</p>{index>0&&<p>سالانه: {index===1?'۲٬۵۰۰٬۰۰۰':'۳٬۵۰۰٬۰۰۰'} تومان · ۳۶۵ روز</p>}</article>)}</div>
            <p>اشتراک سالانه با قیمت ۱۰ دوره ۳۰روزه عرضه می‌شود: حرفه‌ای ۵۰۰ هزار تومان و ویژه ۷۰۰ هزار تومان کمتر از خرید ۱۲ دوره جداگانه. تمدید خودکار و برداشت خودکار نداریم.</p>
            <p>ثبت‌نام همیشه با پایه رایگان شروع می‌شود. کاور و پروفایل جدا از ظرفیت عکس‌اند؛ تعداد آلبوم‌ها محدود نیست. ویدیو MP4 حداکثر ۲۰ ثانیه و ۱۵ مگابایت است. ارتقا پس از ثبت‌نام و فعال‌شدن پرداخت امکان‌پذیر است.</p>
          </details>
          <BusinessOnboardingWizard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
