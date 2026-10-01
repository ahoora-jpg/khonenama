import { ArrowUpLeft, MapPin, Search, Store } from "lucide-react";

const links = [
  { title: "کسب‌وکارهای شهر شما", text: "شهر یا محله خود را در جستجو وارد کنید", href: "/search", icon: MapPin },
  { title: "فروشگاه‌ها و متخصصان", text: "بر اساس نوع خدمت، اطلاعات و نمونه‌کار انتخاب کنید", href: "/#categories", icon: Search },
  { title: "معرفی کسب‌وکار شما", text: "فروشگاه یا خدمات خود را با محدوده فعالیت واقعی معرفی کنید", href: "/register-business", icon: Store },
];

export default function LocalDiscovery() {
  return (
    <section className="section local-discovery" aria-labelledby="local-discovery-title">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker">دکوراسیون در شهرهای ایران</span>
            <h2 id="local-discovery-title">از شهر و محله خودت شروع کن.</h2>
          </div>
          <p>
            شهر و نوع خدمت موردنیاز را مشخص کنید و کسب‌وکارهای ثبت‌شده را بر اساس محدوده فعالیتشان بررسی کنید.
            برای انتخاب فروشگاه و مجری، فاصله، نمونه‌کار و دسترسی واقعی مهم است.
          </p>
        </div>

        <div className="local-discovery-grid">
          {links.map(({ title, text, href, icon: Icon }) => (
            <a className="local-discovery-card" href={href} key={href}>
              <span className="local-discovery-icon"><Icon size={20} /></span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowUpLeft size={18} className="local-discovery-arrow" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
