import { ArrowUpLeft, BadgeCheck, BarChart3, Store } from "lucide-react";

export default function BusinessCTA() {
  return (
    <section className="section" id="join">
      <div className="shell">
        <div className="business-cta">
          <div className="cta-glow cta-glow-one" />
          <div className="cta-glow cta-glow-two" />

          <div className="cta-copy">
            <span className="cta-kicker">برای کسب‌وکارهای دکوراسیون</span>
            <h2>مشتری بعدی شاید همین الان دنبال شماست.</h2>
            <p>
              پروفایل بسازید، نمونه‌کارها را نمایش دهید و در جستجوهای محلی بهتر دیده شوید.
              ثبت اولیه کسب‌وکار در نسخه شروع رایگان است.
            </p>
            <div className="cta-actions">
              <a href="/register-business" className="pill-button light">ثبت رایگان کسب‌وکار <ArrowUpLeft size={17} /></a>
              <a href="/dashboard" className="pill-button ghost-light">مشاهده داشبورد</a>
            </div>
          </div>

          <div className="cta-feature-stack" aria-hidden="true">
            <div className="cta-feature glass-dark"><Store size={20} /><span><strong>پروفایل فروشگاه</strong><small>اطلاعات، خدمات و نمونه‌کار</small></span></div>
            <div className="cta-feature glass-dark"><BadgeCheck size={20} /><span><strong>نشان تأیید</strong><small>اعتماد بیشتر برای کاربران</small></span></div>
            <div className="cta-feature glass-dark"><BarChart3 size={20} /><span><strong>آمار بازدید</strong><small>در نسخه حرفه‌ای</small></span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
