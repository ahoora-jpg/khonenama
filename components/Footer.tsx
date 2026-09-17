const groups = [
  { title: "دسته‌ها", links: ["پرده", "موکت", "کفپوش", "کاغذ دیواری", "طراحی داخلی"] },
  { title: "کرج", links: ["برغان", "عظیمیه", "جهانشهر", "گوهردشت", "مهرشهر"] },
  { title: "خونه‌نما", links: ["درباره ما", "ثبت کسب‌وکار", "مجله", "تماس با ما", "قوانین"] },
];

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="shell footer glass-panel">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="#top">خونه<span>نما</span></a>
            <p>مرجع پیدا کردن فروشگاه‌ها، متخصصان و خدمات دکوراسیون منزل؛ شروع از کرج و خیابان برغان.</p>
            <form className="newsletter">
              <input type="email" aria-label="ایمیل" placeholder="ایمیل شما" />
              <button type="submit">عضویت</button>
            </form>
          </div>

          {groups.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => <a href="#" key={link}>{link}</a>)}
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
