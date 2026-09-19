import { ArrowUpLeft, MapPin, Search, Store } from "lucide-react";

const links = [
  { title: "دکوراسیون در کرج", text: "فروشگاه‌ها و متخصصان دکوراسیون در سراسر کرج", href: "/karaj", icon: MapPin },
  { title: "دکوراسیون برغان", text: "پرده، کفپوش، دیوارپوش و خدمات نزدیک خیابان برغان", href: "/karaj/baraghan", icon: Store },
  { title: "پرده در کرج", text: "فروشگاه‌ها و خدمات پرده، دوخت و نصب", href: "/category/curtain", icon: Search },
];

export default function LocalDiscovery() {
  return (
    <section className="section local-discovery" aria-labelledby="local-discovery-title">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker">پیدا کردن نزدیک‌تر</span>
            <h2 id="local-discovery-title">از شهر و محله خودت شروع کن.</h2>
          </div>
          <p>
            خونه‌نما جستجوی محلی را جدی می‌گیرد؛ چون برای انتخاب فروشگاه و مجری،
            فاصله، نمونه‌کار و دسترسی واقعی مهم است.
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
