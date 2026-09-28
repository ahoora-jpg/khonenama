import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountDeletionForm from "@/components/AccountDeletionForm";

const pageUrl = "https://khonenama.ir/account-deletion";

export const metadata: Metadata = {
  title: { absolute: "درخواست حذف حساب و اطلاعات | خونه نما" },
  description: "ثبت درخواست حذف حساب، پروفایل کسب‌وکار و اطلاعات مرتبط در خونه نما.",
  alternates: { canonical: pageUrl },
  robots: { index: true, follow: true },
};

export default function AccountDeletionPage() {
  return (
    <main>
      <Header />
      <section className="inner-page legal-page">
        <div className="shell legal-shell">
          <header className="legal-hero glass-panel">
            <span className="section-kicker">کنترل اطلاعات حساب</span>
            <h1>درخواست حذف حساب خونه نما</h1>
            <p>این مسیر برای کاربران سایت و اپ اندروید در دسترس است و بدون نصب اپ هم می‌توانید درخواست را ثبت کنید.</p>
          </header>
          <article className="legal-content glass-panel">
            <h2>چه اطلاعاتی حذف یا غیرفعال می‌شود؟</h2>
            <p>پس از احراز مالکیت حساب، نشست‌های ورود باطل می‌شوند، پروفایل عمومی از نمایش خارج می‌شود و اطلاعات حساب و محتوای وابسته طبق درخواست و الزامات قانونی حذف یا ناشناس‌سازی می‌شوند.</p>
            <h2>چه اطلاعاتی ممکن است باقی بماند؟</h2>
            <p>سوابق ضروری برای امنیت، جلوگیری از سوءاستفاده، حل اختلاف، حسابرسی یا الزام قانونی ممکن است فقط برای مدت لازم نگهداری شوند و برای استفاده عمومی یا تبلیغاتی پردازش نمی‌شوند.</p>
            <h2>زمان و احراز مالکیت</h2>
            <p>ثبت فرم به معنی حذف فوری نیست. برای جلوگیری از حذف غیرمجاز، مالکیت شماره و کسب‌وکار بررسی می‌شود. درخواست تأییدشده در کوتاه‌ترین زمان عملیاتی رسیدگی خواهد شد.</p>
            <AccountDeletionForm />
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
