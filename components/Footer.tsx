import { CircleHelp, ExternalLink, Instagram, MapPin, MessageCircle, Sparkles } from "lucide-react";

const groups = [
  {
    title: "دسته‌ها",
    links: [
      ["پرده", "/category/curtain"],
      ["موکت", "/category/carpet"],
      ["کفپوش", "/category/flooring"],
      ["کاغذ دیواری", "/category/wallpaper"],
      ["طراحی داخلی", "/category/interior-design"],
      ["خانه هوشمند", "/category/smart-home"],
    ],
  },
  {
    title: "انتخاب خدمات",
    links: [
      ["جستجو در شهر شما", "/search"],
      ["محاسبه پارچه پرده", "/tools/curtain-fabric-calculator"],
      ["برآورد کفپوش", "/tools/flooring-estimator"],
      ["برآورد موکت", "/tools/carpet-estimator"],
      ["محاسبه کاغذ دیواری", "/tools/wallpaper-calculator"],
      ["برآورد خانه هوشمند", "/tools/smart-home-scope"],
    ],
  },
  {
    title: "دسترسی سریع",
    links: [
      ["مجله خونه نما", "/magazine"],
      ["راهنمای پرده شید", "/magazine/shade-curtain-guide"],
      ["پرده برقی و نور طبیعی", "/magazine/smart-curtain-daylight-guide"],
      ["ابزار Scope خانه هوشمند", "/tools/smart-home-scope"],
      ["برای کسب‌وکارها", "/for-business"],
      ["راهنمای معرفی آنلاین", "/for-business/online-discovery-guide"],
    ],
  },
  {
    title: "خونه نما",
    links: [
      ["خونه نما چیست؟", "/about"],
      ["راهنما و پشتیبانی", "/help"],
      ["ابزارهای خونه نما", "/tools"],
      ["سیاست تحریریه", "/editorial-policy"],
      ["ثبت کسب‌وکار", "/register-business"],
      ["داشبورد فروشنده", "/dashboard"],
      ["جستجو", "/search"],
      ["پیگیری درخواست", "/request-status"],
      ["گزارش مشکل", "/support"],
      ["غرفه‌های ذخیره‌شده", "/saved"],
      ["دسته‌بندی‌ها", "/#categories"],
      ["حریم خصوصی", "/privacy"],
      ["قوانین استفاده", "/terms"],
    ],
  },
] as const;

const preferredSourceUrl = "https://www.google.com/preferences/source?q=khonenama.ir";

export default function Footer() {
  return (
    <footer className="footer-wrap premium-footer-wrap">
      <div className="shell footer glass-panel premium-footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="/" aria-label="خونه نما"><img src="/khonenama-brand.webp" alt="خونه نما" width={660} height={203} style={{ width: "220px", maxWidth: "100%", height: "auto", display: "block" }} /></a>
            <p>خونه نما مرجع سراسری پیدا کردن و مقایسه فروشگاه‌ها، متخصصان و خدمات دکوراسیون و فضای داخلی خانه در شهرهای ایران است.</p>

            <div className="footer-mini-meta">
              <span><MapPin size={14} /> ایران</span>
              <a href="/help"><CircleHelp size={14} /> راهنما و پشتیبانی</a>
              <span><Instagram size={14} /> خونه نما</span>
            </div>

            <div className="footer-trust-links">
              <a href="/privacy">حریم خصوصی</a>
              <a href="/terms">قوانین استفاده</a>
              <a href="/editorial-policy">سیاست تحریریه</a>
              <a href={preferredSourceUrl} target="_blank" rel="noopener noreferrer">
                <Sparkles size={13} /> افزودن به منابع ترجیحی گوگل
              </a>
              <a
                href="https://wa.me/989122606778?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A7%D8%B2%20%D8%B3%D8%A7%DB%8C%D8%AA%20%D8%AE%D9%88%D9%86%D9%87%20%D9%86%D9%85%D8%A7%20%D9%BE%DB%8C%D8%A7%D9%85%20%D9%85%DB%8C%E2%80%8C%D8%AF%D9%87%D9%85."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={13} /> ارتباط با ادمین
              </a>
            </div>
          </div>

          {groups.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© ۲۰۲۶ خونه نما · همه حقوق محفوظ است.</span>
          <div className="footer-credit">
            <a href="/admin/login" rel="nofollow" style={{ fontSize: "12px", fontWeight: 400 }}>ورود مدیریت</a>
            <span>طراحی و توسعه وب:</span>
            <a href="https://ahoora-studio.ir/" target="_blank" rel="noopener">
              Ahoora Studio <ExternalLink size={12} />
            </a>
            <a
              href="https://wa.me/989122606778?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A7%D8%B2%20%D8%B3%D8%A7%DB%8C%D8%AA%20%D8%AE%D9%88%D9%86%D9%87%20%D9%86%D9%85%D8%A7%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%AA%D9%85%D8%A7%D8%B3%20%D8%A8%D8%A7%20Ahoora%20Studio%20%D9%BE%DB%8C%D8%A7%D9%85%20%D9%85%DB%8C%E2%80%8C%D8%AF%D9%87%D9%85."
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={12} /> واتساپ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
