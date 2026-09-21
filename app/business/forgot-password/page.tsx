import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "بازیابی رمز کسب‌وکار",
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
            <h2>رمز را فراموش کردی؟ برای Pilot از پشتیبانی کمک بگیر.</h2>\n            <p>بازیابی خودکار ایمیلی و پیامکی هنوز فعال نشده است؛ تا زمان اتصال سرویس ارسال، بازیابی حساب از مسیر پشتیبانی انجام می‌شود.</p>
          </div>
          <ForgotPasswordForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
