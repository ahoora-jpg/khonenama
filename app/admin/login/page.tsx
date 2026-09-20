import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata: Metadata = {
  title: "ورود مدیریت | خونه‌نما",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main>
      <Header />
      <section className="inner-page business-login-page">
        <div className="shell business-login-layout">
          <div className="business-login-copy">
            <span className="section-kicker">پنل داخلی</span>
            <h2>بررسی و انتشار کسب‌وکارها</h2>
            <p>صف بررسی کسب‌وکارهای ثبت‌شده، وضعیت انتشار و کنترل کیفیت پروفایل‌ها.</p>
          </div>
          <AdminLoginForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
