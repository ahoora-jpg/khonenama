import { ArrowUpLeft, BadgeCheck, BarChart3, Sparkles, Store } from "lucide-react";

export default function BusinessCTA() {
  return (
    <section className="section premium-join" id="join">
      <div className="shell">
        <div className="business-cta premium-business-cta">
          <div className="cta-grid-pattern" aria-hidden="true" />
          <div className="cta-glow cta-glow-one" />
          <div className="cta-glow cta-glow-two" />

          <div className="cta-copy">
            <span className="cta-kicker"><Sparkles size={14} /> برای کسب‌وکارهای دکوراسیون</span>
            <h2>ویترین حرفه‌ای تو، جایی که مشتری دنبالت می‌گردد.</h2>
            <p>
              پروفایل بساز، خدمات و نمونه‌کارت را معرفی کن و در جستجوهای محلی خونه‌نما بهتر دیده شو.
              شروع ثبت کسب‌وکار رایگان است.
            </p>
            <div className="cta-actions">
              <a href="/register-business" className="pill-button light premium-light-cta">ثبت رایگان کسب‌وکار <ArrowUpLeft size={17} /></a>
              <a href="/dashboard" className="pill-button ghost-light">مشاهده داشبورد</a>
            </div>
          </div>

          <div className="cta-feature-stack premium-feature-stack" aria-hidden="true">
            <div className="cta-feature glass-dark"><Store size={20} /><span><strong>پروفایل حرفه‌ای</strong><small>خدمات، تصاویر و راه‌های ارتباطی</small></span></div>
            <div className="cta-feature glass-dark"><BadgeCheck size={20} /><span><strong>اعتماد بیشتر</strong><small>نشان تأیید و اطلاعات کامل</small></span></div>
            <div className="cta-feature glass-dark"><BarChart3 size={20} /><span><strong>دید بهتر</strong><small>جستجوی محلی و جایگاه ویژه</small></span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
