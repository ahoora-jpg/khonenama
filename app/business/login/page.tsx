import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessLoginForm from "@/components/BusinessLoginForm";

export const metadata: Metadata = {
  title: "ورود کسب‌وکار",
  robots: { index: false, follow: false },
};

export default function BusinessLoginPage() {
  return (
    <main>
      <Header />
      <section className="inner-page business-login-page">
        <div className="shell business-login-layout">
          <div className="business-login-copy">
            <span className="section-kicker">پنل فروشندگان و متخصصان</span>
            <h2>پروفایل، مشتری‌ها و اشتراکت را یکجا مدیریت کن.</h2>
            <p>با شماره همراه و رمز عبور وارد شوید. اگر رمز را فراموش کرده‌اید، از گزینه بازیابی رمز برای دریافت لینک در ایمیل ثبت‌شده استفاده کنید.</p>
          </div>
          <BusinessLoginForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
