import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const pageUrl = "https://khonenama.ir/karaj/curtain/markets";
const title = "بورس پرده کرج | برغان، میانجاده و جاده ملارد | خونه نما";
const description = "راهنمای بورس‌ها و محورهای شناخته‌شده پرده در کرج؛ خیابان برغان، میانجاده و بلوار حدادی، و محور جاده ملارد–فردیس را با شواهد واقعی و نکات مقایسه بررسی کنید.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/karaj/curtain/markets" },
  openGraph: { title, description, url: pageUrl, locale: "fa_IR", type: "article" },
};

const markets = [
  {
    name: "خیابان برغان کرج",
    status: "قطب شناخته‌شده پرده",
    text: "در خیابان برغان چند فروشگاه و گالری پرده ثبت شده‌اند؛ برای مقایسه حضوری پارچه، دوخت، یراق و خدمات نصب، این محور یکی از نقاط جدی بازار پرده کرج است.",
    sources: [
      ["پرده نفیس در خیابان برغان", "https://www.waze.com/live-map/directions/ir/krj/prdh-nfys?to=place.ChIJfe3TOwC_jT8Rh9VWy0bNpIg"],
      ["فهرست پرده‌فروشی‌های کرج", "https://faratat.com/city/karaj/%D9%85%D8%B9%D8%B1%D9%81%DB%8C-15-%D8%AA%D8%A7-%D8%A7%D8%B2-%D8%A8%D9%87%D8%AA%D8%B1%DB%8C%D9%86-%D9%BE%D8%B1%D8%AF%D9%87-%D9%81%D8%B1%D9%88%D8%B4%DB%8C-%D8%AF%D8%B1-%DA%A9%D8%B1%D8%AC/"],
    ],
  },
  {
    name: "میانجاده و بلوار شهید حدادی",
    status: "خوشه فعال پرده و دکوراسیون",
    text: "در میانجاده و بلوار شهید حدادی چند فروشگاه پرده و مجموعه دکوراسیون ثبت شده‌اند. این محدوده برای مقایسه پرده‌های آماده، زبرا، شید و خدمات نصب ارزش بررسی حضوری دارد.",
    sources: [
      ["فهرست فروشگاه‌های پرده بلوار حدادی", "https://iran-streets.openalfa.com/alborz-province/shopping"],
      ["گالری پرده مرینوس در میانجاده", "https://faratat.com/city/karaj/%D9%85%D8%B9%D8%B1%D9%81%DB%8C-15-%D8%AA%D8%A7-%D8%A7%D8%B2-%D8%A8%D9%87%D8%AA%D8%B1%DB%8C%D9%86-%D9%BE%D8%B1%D8%AF%D9%87-%D9%81%D8%B1%D9%88%D8%B4%DB%8C-%D8%AF%D8%B1-%DA%A9%D8%B1%D8%AC/"],
    ],
  },
  {
    name: "جاده ملارد و فردیس",
    status: "محور فروش پرده با شواهد تجاری",
    text: "در محور جاده ملارد–فردیس فروشگاه‌های پرده فعال‌اند و دست‌کم یک مجموعه با عنوان بورس پرده در همین محور فعالیت و آدرس عمومی منتشر کرده است. این محور را فعلاً به‌عنوان بازار فعال ثبت می‌کنیم، نه بورس قطعی کل شهر.",
    sources: [
      ["بورس پرده وزراء در جاده ملارد", "https://t.me/s/parde_vozara?before=813"],
      ["فهرست فروشگاه‌های پرده فردیس", "https://iran-streets.openalfa.com/alborz-province/shopping"],
    ],
  },
] as const;

const faq = [
  { q: "بورس پرده کرج کجاست؟", a: "بر اساس شواهد فعلی، خیابان برغان، میانجاده و بلوار شهید حدادی، و محور جاده ملارد–فردیس از محدوده‌های مهم بازار پرده کرج هستند. شدت و نوع فعالیت در هر محور یکسان نیست." },
  { q: "برای خرید پرده از بورس‌های کرج چه چیزی را مقایسه کنیم؟", a: "برای مدل و ابعاد یکسان، پارچه، دوخت، یراق، مکانیزم، اندازه‌گیری، حمل، نصب، زمان تحویل و ضمانت را جداگانه مقایسه کنید." },
  { q: "آیا هر محدوده‌ای که چند پرده‌فروشی دارد بورس محسوب می‌شود؟", a: "خیر. خونه نما بین بورس شناخته‌شده، خوشه فعال و یک فروشگاه منفرد تفاوت می‌گذارد و فقط بر اساس شواهد موجود برچسب می‌زند." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
};
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خونه نما", item: "https://khonenama.ir/" },
    { "@type": "ListItem", position: 2, name: "کرج", item: "https://khonenama.ir/karaj" },
    { "@type": "ListItem", position: 3, name: "پرده در کرج", item: "https://khonenama.ir/karaj/curtain" },
    { "@type": "ListItem", position: 4, name: "بورس پرده کرج", item: pageUrl },
  ],
};

export default function KarajCurtainMarketsPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />
      <section className="inner-page legal-page">
        <div className="shell legal-shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه"><a href="/">خونه نما</a><span>/</span><a href="/karaj">کرج</a><span>/</span><a href="/karaj/curtain">پرده</a><span>/</span><span>بورس پرده</span></nav>
          <header className="legal-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه نما</span>
            <h1>بورس پرده کرج؛ برغان، میانجاده و جاده ملارد</h1>
            <p>برای پیدا کردن پرده‌فروشی در کرج لازم نیست همه محله‌ها را جداگانه بررسی کنید. خونه نما فقط محورهایی را معرفی می‌کند که برای آن‌ها شواهد واقعی از تمرکز فروشگاه‌ها یا فعالیت تجاری پرده وجود دارد.</p>
          </header>
          <article className="legal-content glass-panel">
            <h2>محورهای مهم بازار پرده در کرج</h2>
            <div className="local-intent-grid">
              {markets.map((market) => (
                <section className="local-intent-card" key={market.name}>
                  <span className="section-kicker">{market.status}</span>
                  <h3>{market.name}</h3>
                  <p>{market.text}</p>
                  <div className="source-list">
                    {market.sources.map(([label, href]) => <a href={href} target="_blank" rel="noopener noreferrer" key={href}>{label}</a>)}
                  </div>
                </section>
              ))}
            </div>

            <h2>روش استفاده از این راهنما</h2>
            <p>وجود فروشگاه در یک خیابان به‌تنهایی به معنی «بورس» نیست. در این صفحه بین قطب شناخته‌شده، خوشه فعال و محور فروش تفاوت گذاشته‌ایم و هر محدوده را با همان درجه اطمینان معرفی می‌کنیم.</p>
            <p>برای انتخاب فروشنده، نمونه‌کار واقعی، نوع پارچه و یراق، خدمات اندازه‌گیری و نصب، زمان تحویل و ضمانت را بررسی کنید. قیمت‌ها و شرایط اقساطی ممکن است تغییر کنند و باید مستقیم از همان کسب‌وکار تأیید شوند.</p>

            <h2>سوالات متداول</h2>
            <section className="guide-faq">
              {faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
            </section>
            <div className="guide-next-actions">
              <a href="/karaj/curtain">پرده در کرج</a>
              <a href="/category/curtain">راهنمای جامع پرده</a>
              <a href="/tools/curtain-fabric-calculator">محاسبه متراژ پارچه پرده</a>
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
