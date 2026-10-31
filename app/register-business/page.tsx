import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessOnboardingWizard from "@/components/BusinessOnboardingWizard";
import { RegistrationGift } from "@/components/RegistrationOffers";
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
                در کمتر از چند دقیقه غرفه‌ات را با اطلاعات واقعی بساز. با انتخاب دسته و خدمت معتبر، غرفه همان ابتدا قابل مشاهده است.
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
            <p>برای ساخت اولیه فقط شماره همراه، رمز، نام کسب‌وکار، شهر، دسته و یک خدمت اصلی لازم است. معرفی، آدرس، شبکه اجتماعی و نمونه‌کار را بعداً و در زمان دلخواه کامل کنید. مشخصات و عکس خصوصی مشتری را در غرفه عمومی وارد نکنید.</p>
            <a href="/for-business/online-discovery-guide#profile-checklist">چک‌لیست کامل آماده‌سازی غرفه در شش حوزه</a>
          </details>
          <BusinessOnboardingWizard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
