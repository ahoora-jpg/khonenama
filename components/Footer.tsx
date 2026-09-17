const groups = [
  {
    title: "دسته‌ها",
    links: [
      ["پرده", "/category/curtain"],
      ["موکت", "/category/carpet"],
      ["کفپوش", "/category/flooring"],
      ["کاغذ دیواری", "/category/wallpaper"],
      ["طراحی داخلی", "/category/interior-design"],
    ],
  },
  {
    title: "کرج",
    links: [
      ["برغان", "/search?q=پرده&location=برغان"],
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
      ["دسته‌بندی‌ها", "/#categories"],
      ["فروشگاه‌های منتخب", "/#featured"],
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="shell footer glass-panel">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="/">خونه<span>نما</span></a>
            <p>مرجع پیدا کردن فروشگاه‌ها، متخصصان و خدمات دکوراسیون منزل؛ شروع از کرج و خیابان برغان.</p>
            <form className="newsletter" action="#">
              <input type="email" aria-label="ایمیل" placeholder="ایمیل شما" />
              <button type="button">عضویت</button>
            </form>
          </div>

          {groups.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© ۲۰۲۶ خونه‌نما</span>
          <span>khonenama.ir</span>
        </div>
      </div>
    </footer>
  );
}
