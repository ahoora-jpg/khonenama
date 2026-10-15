import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreferredSourceCTA from "@/components/PreferredSourceCTA";
import { guides } from "@/lib/guides";
import { contentPaths } from "@/lib/content-paths";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BookOpen, Clock3 } from "lucide-react";

const magazineUrl = "https://khonenama.ir/magazine";
const magazineTitle = "مجله خونه نما | راهنمای دکوراسیون و خانه هوشمند";
const magazineDescription =
  "پاسخ سؤال‌های خرید، اندازه‌گیری و نصب پرده، کفپوش، موکت، دیوارپوش، طراحی داخلی، نورپردازی و خانه هوشمند؛ راهنما، ابزار و کسب‌وکار مرتبط را پیدا کنید.";

export const metadata: Metadata = {
  title: { absolute: magazineTitle },
  description: magazineDescription,
  alternates: { canonical: magazineUrl },
  openGraph: {
    title: magazineTitle,
    description: magazineDescription,
    url: magazineUrl,
    siteName: "خونه نما",
    locale: "fa_IR",
    type: "website",
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": magazineUrl + "#collection",
  url: magazineUrl,
  name: magazineTitle,
  description: magazineDescription,
  inLanguage: "fa-IR",
  isPartOf: { "@id": "https://khonenama.ir/#website" },
  publisher: { "@id": "https://khonenama.ir/#organization" },
  publishingPrinciples: "https://khonenama.ir/editorial-policy",
  about: [
    { "@type": "Thing", name: "پرده و پوشش پنجره" },
    { "@type": "Thing", name: "کفپوش و پارکت" },
    { "@type": "Thing", name: "موکت" },
    { "@type": "Thing", name: "کاغذ دیواری و دیوارپوش" },
    { "@type": "Thing", name: "طراحی داخلی" },
    { "@type": "Thing", name: "خانه هوشمند" },
    { "@type": "Thing", name: "نورپردازی داخلی" },
  ],
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: `https://khonenama.ir/magazine/${guide.slug}`,
    })),
  },
};

export default function MagazinePage() {
  const usedImageSrc = new Set<string>();

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <Header />
      <section className="inner-page">
        <div className="shell">
          <img className="magazine-editorial-cover" src="/images/magazine/khonenama-magazine-landscape.webp" alt="مجله خونه‌نما؛ نور و زندگی در خانه" width={1440} height={810} decoding="async" />
          <div className="category-hero glass-panel magazine-hero">
            <span className="section-kicker">مجله خونه نما</span>
            <h1>راهنمای انتخاب برای خانه</h1>
            <p>
              قبل از خرید، فرق گزینه‌ها را بفهمید؛ بعد فروشگاه و متخصص مناسب را پیدا کنید. روش نگارش و به‌روزرسانی مطالب در <a href="/editorial-policy">سیاست تحریریه خونه نما</a> توضیح داده شده است.
            </p>
          </div>

          <PreferredSourceCTA />
          <section className="glass-panel" style={{padding:24,marginBlock:24}} aria-labelledby="minimal-featured">
            <span className="section-kicker">پیشنهاد مطالعه</span>
            <h2 id="minimal-featured"><a href="/magazine/minimalist-curtain-guide">پرده مینیمال؛ آیا میل‌پرده قبلی مناسب است؟</a></h2>
            <p>تفاوت ریل موج‌دار، لغزنده و نوار دوخت با میل‌پرده معمولی؛ چه زمانی باید یراق عوض شود و کیفیت آن چه اثری روی حرکت پرده دارد؟</p>
            <a href="/magazine/minimalist-curtain-guide">خواندن راهنمای کامل پرده مینیمال</a>
          </section>

          <section aria-labelledby="content-paths-title">
            <h2 id="content-paths-title">از سؤال شما تا انتخاب محصول و مجری</h2>
            <p>موضوع خود را انتخاب کنید، پاسخ اولیه و راهنماهای مرتبط را بخوانید و بعد مشخصات پروژه را با فروشنده یا مجری در میان بگذارید. نتیجه محاسبه‌گر برآورد اولیه است؛ قیمت نهایی و شرایط اجرا را از کسب‌وکار واقعی بگیرید.</p>
            <nav aria-label="موضوع‌های راهنمای دکوراسیون">
              <ul>{contentPaths.map((path) => <li key={path.id}><a href={"#guide-path-" + path.id}>{path.name}</a></li>)}</ul>
            </nav>
            <div className="magazine-grid">
              {contentPaths.map((path) => (
                <article className="magazine-card" id={"guide-path-" + path.id} key={path.id}>
                  <span className="magazine-category">{path.name}</span>
                  <h3>{path.question}</h3>
                  <p>{path.answer}</p>
                  <h4>پیش از خرید یا سفارش</h4>
                  <ul>{path.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
                  <h4>راهنماهای مکمل</h4>
                  <ul>{path.guideSlugs.map((slug) => {
                    const guide = guides.find((item) => item.slug === slug);
                    return guide ? <li key={slug}><a href={"/magazine/" + slug}>{guide.title}</a></li> : null;
                  })}</ul>
                  {path.tool ? <p><a href={path.tool.href}>{path.tool.label}</a></p> : null}
                  <p><a href={path.category}>فروشگاه‌ها و خدمات {path.name}</a></p>
                </article>
              ))}
            </div>
          </section>

          <h2>همه راهنماهای خونه‌نما</h2>

          <div className="magazine-grid">
            {guides.map((guide) => {
              const visual = getGuideVisual(guide.category, guide.slug);
              const showImage = !usedImageSrc.has(visual.src);
              if (showImage) usedImageSrc.add(visual.src);
              return (
                <article className="magazine-card" key={guide.slug}>
                  {showImage ? (
                    <img className="magazine-card-image" src={visual.src} alt={visual.alt} width={1200} height={675} loading="lazy" decoding="async" />
                  ) : (
                    <div className="magazine-card-image magazine-card-image-placeholder" aria-hidden="true"><span>{guide.category}</span></div>
                  )}
                  <div className="magazine-card-top">
                    <span className="magazine-category">{guide.category}</span>
                    <span className="magazine-readtime"><Clock3 size={13} /> {guide.readTime}</span>
                  </div>
                  <BookOpen size={22} className="magazine-icon" />
                  <h2>{guide.title}</h2>
                  <p>{guide.excerpt}</p>
                  <a href={"/magazine/" + guide.slug}>
                    مطالعه راهنما <ArrowUpLeft size={15} />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
