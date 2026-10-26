import type { Metadata } from "next";
import AdminLoginForm from "@/components/AdminLoginForm";
import "../sms.css";

export const metadata: Metadata = { title: "ورود مرکز پیامک خونه‌نما", robots: { index: false, follow: false } };

export default function SmsLoginPage() {
  return <main dir="rtl" className="shell sms-workspace" style={{ minHeight: "100vh", paddingBlock: 48 }}>
    <header style={{ marginBottom: 32 }}><strong>خونه‌نما · مرکز پیامک</strong></header>
    <section className="business-login-layout">
      <div className="business-login-copy"><span className="section-kicker">پنل داخلی</span><h1>ورود مرکز پیامک</h1>
        <p>با رمز مدیریت فعلی خونه‌نما وارد شوید. اگر محافظت با کلید اختصاصی پیامک تنظیم شده باشد، در مرحلهٔ بعد درخواست می‌شود.</p></div>
      <AdminLoginForm redirectTo="/sms" keyLabel="رمز مدیریت خونه‌نما" title="ورود مرکز پیامک" />
    </section>
  </main>;
}
