import type { Metadata } from "next";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata: Metadata = { title: "ورود مرکز پیامک خونه‌نما", robots: { index: false, follow: false } };

export default function SmsLoginPage() {
  return <main dir="rtl" className="shell" style={{ minHeight: "100vh", paddingBlock: 48 }}>
    <header style={{ marginBottom: 32 }}><strong>خونه‌نما · مرکز پیامک</strong></header>
    <section className="business-login-layout">
      <div className="business-login-copy"><span className="section-kicker">پنل داخلی</span><h1>ورود مرکز پیامک</h1>
        <p>برای دسترسی، ابتدا با کلید مدیریت سایت وارد شوید. سپس کلید مستقل مرکز پیامک درخواست می‌شود.</p></div>
      <AdminLoginForm redirectTo="/" />
    </section>
  </main>;
}
