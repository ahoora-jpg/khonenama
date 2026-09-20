import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "بازیابی رمز کسب‌وکار | خونه‌نما",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main>
      <Header />
      <section className="inner-page business-login-page">
        <div className="shell business-login-layout">
          <div className="business-login-copy">
            <span className="section-kicker">بازیابی حساب</span>
            <h2>رمز را فراموش کردی؟ مسیر بازیابی از قبل آماده است.</h2>
            <p>ایمیل، مسیر کم‌هزینه‌تر بازیابی خواهد بود و پیامک به‌عنوان مسیر جایگزین پس از اتصال سرویس SMS فعال می‌شود.</p>
          </div>
          <ForgotPasswordForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
