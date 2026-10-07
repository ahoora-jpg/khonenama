import { ArrowUpLeft, Store } from "lucide-react";

export default function HomeBoothInvitation() {
  return <section className="section home-booth-invitation" aria-labelledby="booth-invitation-title">
    <div className="shell"><div className="market-empty">
      <Store size={32} />
      <h3 id="booth-invitation-title">جای غرفه شما در این بازار آماده است.</h3>
      <p>با انتشار کسب‌وکار شما، اطلاعات و نمونه‌کارهایتان در ویترین غرفه‌ها در دسترس مشتریان قرار می‌گیرد.</p>
      <a className="pill-button dark" href="/register-business">ثبت رایگان کسب‌وکار <ArrowUpLeft size={17} /></a>
    </div></div>
  </section>;
}
