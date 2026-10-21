import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessOnboardingWizard from "@/components/BusinessOnboardingWizard";
import { RegistrationGift, RegistrationPlanImages } from "@/components/RegistrationOffers";
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
          <RegistrationGift />
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
            <p>فروشگاه، نصاب، مجری و متخصص نورپردازی و دیگر خدمات مرتبط می‌توانند غرفه بسازند. نام و توضیح واقعی کسب‌وکار، دسته و خدمات، شهر و محدوده فعالیت، راه تماس عمومی و تصاویر متعلق به خودتان را آماده کنید. مشخصات و عکس خصوصی مشتری را در غرفه عمومی وارد نکنید.</p>
            <a href="/for-business/online-discovery-guide#profile-checklist">چک‌لیست کامل آماده‌سازی غرفه در شش حوزه</a>
          </details>
          <details className="glass-panel" style={{padding:"1rem",marginBottom:"1rem"}} open>
            <summary>مقایسه ظرفیت و هزینه اشتراک‌ها</summary>
            <RegistrationPlanImages />
            <p>خرید اشتراک سالانه فعلاً فعال نیست؛ قیمت سالانه درج‌شده در تصویرها قابل خرید نیست.</p>
            <img src="/images/plans/custom-20261015.webp" width={1000} height={1000} alt="افزونه ویژه؛ هر بسته ۲۰ عکس و ۱ ویدیو، ۱۵ هزار تومان؛ فقط برای پلن ویژه" loading="lazy" style={{width:"100%",maxWidth:360,height:"auto",display:"block",margin:"16px auto"}}/><p>هر بسته افزونه ویژه، ۲۰ عکس و ۱ ویدیو با هزینه ۱۵ هزار تومان برای ۳۰ روز اضافه می‌کند؛ تعداد بسته را خودتان انتخاب می‌کنید. پلن حرفه‌ای افزونه ندارد.</p><p>فایل‌های خارج از ظرفیت رایگان تا ۳۰ روز پس از پایان اشتراک نگهداری می‌شوند؛ پس از آن حذف دائمی می‌شوند. ۱۰ عکس اول، کاور و پروفایل باقی می‌مانند.</p>
            <p>ثبت‌نام با پایه رایگان شروع می‌شود. کاور و پروفایل جدا از ظرفیت عکس‌اند؛ تعداد آلبوم‌ها محدود نیست. ویدیو MP4 حداکثر ۲۰ ثانیه و ۱۵ مگابایت است. خرید اشتراک پس از فعال‌شدن پرداخت امکان‌پذیر است.</p>
          </details>
          <BusinessOnboardingWizard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
