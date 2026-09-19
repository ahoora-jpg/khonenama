import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessOnboardingWizard from "@/components/BusinessOnboardingWizard";
import { BadgeCheck, MapPin, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "ثبت کسب‌وکار | ساخت پروفایل در خونه‌نما",
  description:
    "کسب‌وکار دکوراسیون خود را مرحله‌به‌مرحله ثبت کنید؛ اطلاعات، خدمات، محدوده فعالیت و نمونه‌کار را برای ساخت پروفایل خونه‌نما تکمیل کنید.",
  alternates: { canonical: "/register-business" },
  robots: { index: false, follow: true },
};

export default function RegisterBusinessPage() {
  return (
    <main>
      <Header />

      <section className="inner-page register-page onboarding-page">
        <div className="shell">
          <div className="onboarding-page-heading">
            <div>
              <span className="section-kicker">ثبت کسب‌وکار</span>
              <h1>پروفایل کسب‌وکارت را بساز.</h1>
              <p>
                اطلاعات را مرحله‌به‌مرحله وارد کن؛ ثبت اولیه رایگان است و بعداً از داخل پنل می‌توانی امکانات حرفه‌ای را فعال کنی.
              </p>
            </div>
            <a className="text-link-arrow" href="/for-business">درباره خونه‌نما برای کسب‌وکارها</a>
          </div>

          <div className="onboarding-trust-strip">
            <span><Store size={17} /> پروفایل اختصاصی</span>
            <span><MapPin size={17} /> جستجوی محلی</span>
            <span><ShieldCheck size={17} /> تأیید اطلاعات</span>
            <span><BadgeCheck size={17} /> مسیر دریافت نشان تأییدشده</span>
          </div>

          <BusinessOnboardingWizard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
