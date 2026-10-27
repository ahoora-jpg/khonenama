import type { Metadata } from "next";
import AdminLoginForm from "@/components/AdminLoginForm";
import "../sms.css";

export const metadata: Metadata = { title: "ورود مرکز پیامک خونه‌نما", robots: { index: false, follow: false } };

export default function SmsLoginPage() {
  return <main dir="rtl" className="sms-login sms-workspace">
    <header><img className="sms-brand-image" src="/sms-assets/logo.webp" width={72} height={72} alt="نشان مرکز پیامک خونه‌نما" /><strong>خونه‌نما</strong><span>مرکز پیامک</span></header>
    <section className="sms-login-layout">
      <div className="sms-login-copy"><span className="section-kicker">پنل مدیریت</span><h1>مدیریت پیام‌ها،<br/>در یک فضای منظم.</h1>
        <p>مخاطبان، کمپین‌ها و وضعیت پیام‌ها را از مرکز پیامک خونه‌نما مدیریت کنید.</p><small>دسترسی فقط برای مدیر مجاز است. از رمز مدیریت خونه‌نما استفاده کنید.</small></div>
      <AdminLoginForm redirectTo="/sms" keyLabel="رمز مدیریت خونه‌نما" title="ورود مرکز پیامک" />
    </section>
  </main>;
}
