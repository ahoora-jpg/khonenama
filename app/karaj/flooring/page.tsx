import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses } from "@/lib/demo-data";
import { ArrowUpLeft, BadgeCheck, MapPin, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "کفپوش و پارکت کرج | لمینت، PVC و اجرای کفپوش",
  description:
    "فروشگاه‌ها و مجریان کفپوش، پارکت و لمینت در کرج را مقایسه کنید. راهنمای انتخاب لمینت، PVC، پارکت و نکات اجرای کفپوش در خونه‌نما.",
  alternates: { canonical: "/karaj/flooring" },
  openGraph: {
    title: "کفپوش و پارکت کرج | خونه‌نما",
    description: "فروشگاه‌ها و خدمات کفپوش، پارکت و لمینت در کرج را پیدا و مقایسه کنید.",
    url: "https://khonenama.ir/karaj/flooring",
    locale: "fa_IR",
    type: "website",
  },
};

const flooringBusinesses = businesses.filter(
  (business) => business.city === "کرج" && business.category === "flooring"
);

const faq = [
  {
    question: "برای خانه در کرج پارکت بهتر است یا لمینت؟",
    answer:
      "اگر چوب طبیعی و ظاهر اصیل اولویت دارد پارکت ارزش بررسی دارد؛ اگر نصب سریع‌تر و هزینه کنترل‌شده‌تر می‌خواهید، لمینت معمولاً عملی‌تر است.",
  },
  {
    question: "برای فضای مرطوب لمینت بهتر است یا PVC؟",
    answer:
      "در بسیاری از مدل‌ها PVC مقاومت بیشتری در برابر رطوبت دارد، اما کیفیت نصب و زیرسازی همچنان مهم است.",
  },
  {
    question: "هزینه نصب کفپوش در کرج به چه چیزهایی بستگی دارد؟",
    answer:
      "متراژ، نوع کفپوش، وضعیت زیرسازی، قرنیز، حمل و جزئیات اجرا روی هزینه نهایی اثر می‌گذارند.",
  },
];

export default function KarajFlooringPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "فروشگاه‌ها و مجریان کفپوش در کرج",
    itemListElement: flooringBusinesses.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: business.name,
      url: "https://khonenama.ir/business/" + business.slug,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <section className="inner-page">
        <div className="shell">
          <nav className="guide-breadcrumb" aria-label="مسیر صفحه">
            <a href="/">خونه‌نما</a><span>/</span><a href="/karaj">کرج</a><span>/</span><span>کفپوش و پارکت</span>
          </nav>

          <div className="category-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه‌نما</span>
            <h1>کفپوش و پارکت در کرج</h1>
            <p>
              فروشگاه‌ها و مجریان پارکت، لمینت و کفپوش PVC را در کرج پیدا کنید و قبل از اجرا، جنس، زیرسازی و هزینه نهایی را مقایسه کنید.
            </p>
          </div>

          <section className="local-intent-grid">
            <div className="local-intent-card">
              <h2>پارکت یا لمینت؟</h2>
              <p>پارکت از چوب طبیعی ساخته می‌شود؛ لمینت یک محصول مهندسی‌شده است. ظاهر، نصب، نگهداری و قیمت این دو متفاوت است.</p>
            </div>
            <div className="local-intent-card">
              <h2>لمینت یا PVC؟</h2>
              <p>برای رطوبت بیشتر، PVC معمولاً گزینه مطمئن‌تری است. برای حس نزدیک‌تر به کف چوبی، لمینت می‌تواند مناسب‌تر باشد.</p>
            </div>
            <div className="local-intent-card">
              <h2>قیمت کفپوش در کرج</h2>
              <p>قیمت نهایی فقط قیمت هر متر نیست؛ زیرسازی، فوم یا چسب، قرنیز، حمل و دستمزد نصب را هم در مقایسه لحاظ کنید.</p>
            </div>
            <div className="local-intent-card">
              <h2>مجری نزدیک من</h2>
              <p>نزدیکی مهم است، اما کیفیت زیرسازی و اجرای اتصال‌ها تأثیر بیشتری روی دوام نتیجه دارد. نمونه‌کار و شرایط اجرا را بررسی کنید.</p>
            </div>
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">فروشگاه‌ها و مجریان</span>
                <h2>کفپوش و پارکت در کرج</h2>
              </div>
            </div>

            {flooringBusinesses.length > 0 ? (
              <div className="business-grid">
                {flooringBusinesses.map((business) => (
                  <a className="business-card" href={"/business/" + business.slug} key={business.slug}>
                    <div className="business-media business-generic"><div className="business-media-shape" /></div>
                    <div className="business-content">
                      <div className="business-title-row">
                        <h3>{business.name}</h3>
                        {business.verified && <BadgeCheck size={18} className="verified-icon" />}
                      </div>
                      <p>{business.description}</p>
                      <div className="business-meta-row">
                        <span><MapPin size={14} /> {business.city}، {business.area}</span>
                        <span><Star size={14} fill="currentColor" /> {business.rating}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="category-empty glass-panel">
                <strong>پروفایل‌های کفپوش کرج در حال تکمیل هستند.</strong>
              </div>
            )}
          </section>

          <section className="category-results">
            <div className="section-heading compact-heading">
              <div>
                <span className="section-kicker">راهنمای خرید</span>
                <h2>قبل از انتخاب کفپوش بخوانید</h2>
              </div>
            </div>
            <div className="category-guide-grid">
              <a className="category-guide-card" href="/magazine/flooring-karaj-guide">
                <div><h3>پارکت و لمینت در کرج</h3><p>انتخاب فروشگاه، مجری و هزینه نهایی</p></div><ArrowUpLeft size={16} />
              </a>
              <a className="category-guide-card" href="/magazine/laminate-installation-guide">
                <div><h3>راهنمای نصب لمینت</h3><p>زیرسازی، فوم، فاصله انبساطی و قرنیز</p></div><ArrowUpLeft size={16} />
              </a>
              <a className="category-guide-card" href="/magazine/parquet-vs-laminate">
                <div><h3>تفاوت پارکت و لمینت</h3><p>جنس، نصب، دوام و نگهداری</p></div><ArrowUpLeft size={16} />
              </a>
              <a className="category-guide-card" href="/magazine/laminate-guide">
                <div><h3>لمینت چیست؟</h3><p>ساختار، AC3، AC4 و AC5</p></div><ArrowUpLeft size={16} />
              </a>
              <a className="category-guide-card" href="/magazine/laminate-vs-pvc">
                <div><h3>لمینت یا PVC؟</h3><p>مقایسه برای انتخاب بهتر</p></div><ArrowUpLeft size={16} />
              </a>
            </div>
          </section>

          <section className="category-results category-faq-block">
            <div className="section-heading compact-heading"><div><h2>سوالات متداول درباره کفپوش در کرج</h2></div></div>
            <div className="guide-faq">
              {faq.map((item) => (
                <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
