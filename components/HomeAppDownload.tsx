import { Download, Smartphone } from "lucide-react";

export default function HomeAppDownload() {
  return <section className="home-app-section" aria-labelledby="home-app-title">
    <div className="shell home-app-card">
      <div className="home-app-copy">
        <span className="section-kicker">خونه نما، همراه کسب‌وکار شما</span>
        <h2 id="home-app-title">غرفه‌ات همیشه همراهت باشد</h2>
        <p>با اپ اندروید، نمونه‌کارها را از گوشی اضافه کن و درخواست‌های مشتریان را پیگیری کن.</p>
        <a className="pill-button dark" href="/download-app"><Download size={20} /> دانلود اپلیکیشن اندروید</a>
      </div>
      <div className="home-app-visual">
        <div className="home-app-phone" aria-hidden="true"><Smartphone size={28} /><img src="/khonenama-brand.webp" alt="" width={220} height={68} /><strong>غرفه شما</strong><div className="home-app-phone-photo" /><span>نمونه‌کارها · آلبوم‌ها · درخواست‌ها</span></div>
        <a className="home-app-qr" href="/download-app" aria-label="صفحه دانلود اپلیکیشن"><img src="/images/app-download-qr.svg" alt="کیوآرکد صفحه دانلود اپلیکیشن خونه نما" width={112} height={112} /><span>با گوشی اسکن کن</span></a>
      </div>
    </div>
  </section>;
}
