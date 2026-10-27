import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InspirationGallery from "@/components/InspirationGallery";
import { ArrowUpLeft, Bookmark, Search, Store } from "lucide-react";

const url = "https://khonenama.ir/ideas";
const title = "ایده‌های دکوراسیون داخلی | خونه نما";
const description = "ایده‌های تصویری برای پرده، کفپوش، دیوار، نورپردازی و طراحی داخلی؛ سپس متخصص و غرفه مرتبط را در خونه نما پیدا کنید.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function IdeasPage() {
  return (
    <main>
      <Header />
      <section className="inner-page ideas-page">
        <div className="shell">
          <div className="category-hero glass-panel ideas-hero">
            <span className="section-kicker">ایده‌های خونه‌نما</span>
            <h1>ایده را ببین، بعد انتخاب کن.</h1>
            <p>
              اینجا گالری نمونه‌کار نیست. برای مقایسه سبک، نور، بافت و متریال ساخته شده تا بتوانی نیازت را دقیق‌تر توضیح بدهی و متخصص مناسب را پیدا کنی.
            </p>
            <div className="ideas-hero-actions">
              <a className="pill-button" href="/my-ideas"><Bookmark size={17} /> ایده‌های من</a>
              <a className="pill-button dark" href="/search"><Search size={17} /> یافتن متخصص</a>
              <a className="pill-button" href="/register-business"><Store size={17} /> ساخت غرفه کسب‌وکار</a>
            </div>
          </div>
        </div>
        <InspirationGallery />
        <section className="section ideas-next-step" aria-labelledby="ideas-next-step-title">
          <div className="shell"><div className="glass-panel ideas-next-step-card">
            <div><span className="section-kicker">قدم بعدی</span><h2 id="ideas-next-step-title">ایده را به انتخاب واقعی تبدیل کن.</h2><p>پس از دیدن سبک دلخواه، شهر و خدمت موردنیازت را وارد کن؛ پروفایل، نمونه‌کار و نظر مشتریان غرفه‌ها را مقایسه کن.</p></div>
            <a className="pill-button dark" href="/search">جستجوی غرفه‌ها <ArrowUpLeft size={17} /></a>
          </div></div>
        </section>
      </section>
      <Footer />
    </main>
  );
}
