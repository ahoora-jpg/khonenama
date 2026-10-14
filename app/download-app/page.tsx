import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, Download, ShieldCheck, Smartphone } from "lucide-react";

const pageUrl = "https://khonenama.ir/download-app";
const apkUrl =
  "https://github.com/ahoora-jpg/khonenama-mobile/releases/download/android-1.2.10/khonenama-1.2.10.apk";

export const metadata: Metadata = {
  title: { absolute: "دانلود اپ اندروید خونه نما | نسخه ۱.۲.۱۰" },
  description: "دانلود مستقیم اپلیکیشن اندروید خونه نما و راهنمای نصب امن نسخه رسمی صاحبان کسب‌وکار.",
  alternates: { canonical: pageUrl },
  robots: { index: true, follow: true },
};

const installSteps = [
  ["۱", "دانلود فایل", "روی دکمه دانلود مستقیم بزنید و اجازه دهید فایل APK کامل دریافت شود."],
  ["۲", "بازکردن فایل", "پس از پایان دانلود، فایل APK دانلودشده را از اعلان دانلود یا پوشه Downloads باز کنید."],
  ["۳", "اجازه نصب", "اگر اندروید پیام نصب از این منبع را نشان داد، فقط برای همان مرورگر یا فایل‌منیجر گزینه اجازه نصب را فعال کنید."],
  ["۴", "نصب یا به‌روزرسانی", "گزینه Install یا Update را بزنید. اگر نسخه قبلی با همین امضا نصب شده باشد، گزینه Update نمایش داده می‌شود."],
] as const;

export default function DownloadAppPage() {
  return (
    <main>
      <Header />
      <section className="app-download-page">
        <div className="shell app-download-layout">
          <article className="app-download-hero glass-panel">
            <span className="section-kicker">اپ رسمی اندروید خونه نما</span>
            <div className="app-download-icon" aria-hidden="true"><Smartphone size={34} /></div>
            <h1>غرفه، گالری و درخواست‌های کسب‌وکار، همیشه همراه شما</h1>
            <p>
              نسخه جدید اپ خونه نما برای ثبت کسب‌وکار، عکاسی و آپلود نمونه‌کار، مدیریت گالری و آلبوم، نمایش کیوآرکد و پاسخ‌گویی به درخواست مشتری است.
            </p>
            <a className="pill-button dark app-download-primary" href={apkUrl}>
              <Download size={20} /> دانلود مستقیم نسخه ۱.۲.۱۰
            </a>
            <div className="app-download-facts">
              <span><CheckCircle2 size={16} /> نسخه ۱.۲.۱۰</span>
              <span><CheckCircle2 size={16} /> نسخه آزمایشی آماده نصب</span>
              <span><ShieldCheck size={16} /> فایل نصب رسمی خونه‌نما</span>
            </div>
          </article>

          <aside className="app-install-note glass-panel">
            <ShieldCheck size={26} />
            <div>
              <h2>پیام امنیتی اندروید طبیعی است</h2>
              <p>
                چون نسخه فعلی مستقیماً از سایت نصب می‌شود و هنوز در فروشگاه منتشر نشده، اندروید ممکن است اجازه
                «Install unknown apps» یا «نصب برنامه‌های ناشناس» بخواهد. این اجازه را فقط برای مرورگری که با آن دانلود کرده‌اید فعال کنید.
              </p>
            </div>
          </aside>

          <section className="app-install-guide" aria-labelledby="install-title">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">راهنمای نصب</span>
                <h2 id="install-title">چهار قدم تا شروع کار</h2>
              </div>
            </div>
            <div className="app-install-steps">
              {installSteps.map(([number, title, description]) => (
                <article className="step-card" key={number}>
                  <span className="app-install-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <p className="app-download-security">
            لینک دانلود نسخه ۱.۲.۱۰ در مخزن رسمی خونه‌نما نگهداری می‌شود و تاریخ انقضای لینک Expo را ندارد. دریافت اعلان و عملکرد کامل اپ باید پس از نصب روی گوشی بررسی شود. اثرانگشت SHA-256 فایل: <code>674e3e108e99b9d681b6aa50d0bda00ccb2f8edb01eb946e70ca086262b088a5</code>
            
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}

