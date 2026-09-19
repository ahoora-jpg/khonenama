import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BarChart3, Eye, MessageCircle, MousePointerClick, Store, Upload } from "lucide-react";

const stats = [
  { label: "بازدید پروفایل", value: "—", icon: Eye },
  { label: "کلیک تماس", value: "—", icon: MousePointerClick },
  { label: "درخواست قیمت", value: "—", icon: MessageCircle },
  { label: "رتبه محلی", value: "—", icon: BarChart3 },
];

export const metadata: Metadata = {
  title: "داشبورد کسب‌وکار",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page">
        <div className="shell">
          <div className="dashboard-heading">
            <div><span className="section-kicker">داشبورد فروشنده</span><h1>سلام، صاحب کسب‌وکار 👋</h1><p>این داشبورد فعلاً پوسته محصول است و بعد به حساب کاربری و D1 متصل می‌شود.</p></div>
            <a className="pill-button dark" href="/register-business"><Store size={17} /> تکمیل پروفایل</a>
          </div>

          <div className="dashboard-stats">
            {stats.map(({ label, value, icon: Icon }) => (
              <div className="dashboard-stat glass-panel" key={label}><Icon size={20} /><span><strong>{value}</strong><small>{label}</small></span></div>
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-panel glass-panel">
              <div className="panel-heading"><div><span className="section-kicker">پروفایل</span><h2>اطلاعات کسب‌وکار</h2></div><span className="status-pill">پیش‌نویس</span></div>
              <div className="profile-progress"><span style={{ width: "35%" }} /></div>
              <p>برای انتشار پروفایل، اطلاعات تماس، آدرس، خدمات و حداقل سه تصویر اضافه کنید.</p>
              <a className="pill-button dark" href="/register-business">ادامه تکمیل</a>
            </section>

            <section className="dashboard-panel glass-panel">
              <div className="panel-heading"><div><span className="section-kicker">نمونه‌کار</span><h2>گالری</h2></div><Upload size={20} /></div>
              <div className="dashboard-upload"><Upload size={24} /><strong>تصاویر پروژه را اضافه کنید</strong><small>پس از اتصال ذخیره‌سازی R2 فعال می‌شود.</small></div>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
