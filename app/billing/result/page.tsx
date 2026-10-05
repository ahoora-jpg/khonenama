import Header from "@/components/Header";
import Footer from "@/components/Footer";
export const metadata = { title: "بازگشت از پرداخت", robots: { index: false, follow: false } };
export default function Page() {
  // A query string cannot establish success. Only private server records show the receipt.
  return <main><Header /><section className="inner-page"><div className="shell" dir="rtl"><h1>بررسی نتیجه پرداخت</h1><p>برای مشاهده نتیجه قطعی، شماره پیگیری و اشتراک فعال، سوابق پرداخت حساب خود را باز کنید. اگر نتیجه هنوز در انتظار تأیید است، از همان بخش دوباره بررسی کنید؛ پرداخت تازه‌ای انجام ندهید.</p><a className="pill-button" href="/dashboard/billing">مشاهده نتیجه و اشتراک در سایت</a><p><a href="khonenama://owner/subscription">بازگشت به اپ خونه‌نما</a></p><p>فعال‌سازی پس از تأیید درگاه به‌صورت خودکار انجام می‌شود و تأیید دستی مدیر لازم ندارد.</p></div></section><Footer /></main>;
}
