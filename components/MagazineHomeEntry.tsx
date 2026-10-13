import { ArrowUpLeft } from "lucide-react";

export default function MagazineHomeEntry() {
  return (
    <section className="section magazine-entry">
      <div className="shell magazine-entry-layout">
        <div className="magazine-entry-copy">
          <span className="section-kicker">پرده، نور و دکوراسیون</span>
          <h2>مجله خونه‌نما</h2>
          <p>ایده بگیرید، تفاوت مدل‌ها را بشناسید و قبل از خرید، انتخاب آگاهانه‌تری داشته باشید.</p>
          <a className="pill-button dark" href="/magazine">ورود به مجله <ArrowUpLeft size={20} /></a>
        </div>
        <a className="magazine-entry-book" href="/magazine" aria-label="ورود به مجله خونه‌نما">
          <img src="/images/magazine/khonenama-magazine-cover.webp" alt="جلد مجله خونه‌نما؛ پرده، نور و دکوراسیون" width={900} height={1350} loading="lazy" decoding="async" />
        </a>
      </div>
    </section>
  );
}
