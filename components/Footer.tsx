import { Instagram, Mail, MapPin } from "lucide-react";

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
    title: "کرج",
    links: [
      ["برغان", "/karaj/baraghan"],
      ["عظیمیه", "/search?location=عظیمیه"],
      ["جهانشهر", "/search?location=جهانشهر"],
      ["گوهردشت", "/search?location=گوهردشت"],
      ["مهرشهر", "/search?location=مهرشهر"],
    ],
  },
  {
    title: "خونه‌نما",
    links: [
      ["ثبت کسب‌وکار", "/register-business"],
      ["داشبورد فروشنده", "/dashboard"],
      ["جستجو", "/search"],
      ["پیگیری درخواست", "/request-status"],
      ["دسته‌بندی‌ها", "/#categories"],
      ["فروشگاه‌های منتخب", "/#featured"],
      ["حریم خصوصی", "/privacy"],
      ["قوانین استفاده", "/terms"],
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="footer-wrap premium-footer-wrap">
      <div className="shell footer glass-panel premium-footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="/">خونه<span>نما</span></a>
            <p>مرجع پیدا کردن و مقایسه فروشگاه‌ها، متخصصان و خدمات دکوراسیون منزل؛ با شروع از کرج و خیابان برغان.</p>

            <div className="footer-mini-meta">
              <span><MapPin size={14} /> کرج، البرز</span>
              <span><Mail size={14} /> khonenama.ir</span>
              <span><Instagram size={14} /> خونه‌نما</span>
            </div>

            <div className="footer-trust-links">
              <a href="/privacy">حریم خصوصی</a>
              <a href="/terms">قوانین استفاده</a>
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
          <span>© ۲۰۲۶ خونه‌نما · همه حقوق محفوظ است.</span>
          <span>طراحی برای تجربه بهتر انتخاب در خانه</span>
        </div>
      </div>
    </footer>
  );
}
