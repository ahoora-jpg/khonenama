import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BUSINESS_CATEGORIES } from "@/lib/business-taxonomy";
import { guides } from "@/lib/guides";
import { isIndexableNationalDiscoveryRoute, nationalDiscoveryCitiesForCategory, nationalDiscoveryPath, resolveNationalDiscovery } from "@/lib/national-discovery";
import { safeJsonLd } from "@/lib/safe-json-ld";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";

export const dynamic = "force-dynamic";

type Params = { city: string; category: string };
const baseUrl = "https://khonenama.ir";
const decisionGuides: Record<string, { title: string; items: string[]; tool?: string }> = {
  curtain: { title: "پیش از سفارش پرده", tool: "/tools/curtain-fabric-calculator", items: ["ابعاد محل نصب و جهت بازشو را مشخص کنید.", "نوع کنترل نور و حریم خصوصی موردنیاز را با فروشنده مطرح کنید.", "اندازه‌گیری، دوخت، نصب و تعمیر را در پیشنهادها جدا مقایسه کنید."] },
  flooring: { title: "پیش از انتخاب کفپوش", tool: "/tools/flooring-estimator", items: ["کاربری فضا، رطوبت و وضعیت زیرسازی را مشخص کنید.", "متراژ خالص و پرت برش را جداگانه برآورد کنید.", "هزینهٔ زیرسازی، قرنیز و نصب را از خود متریال تفکیک کنید."] },
  carpet: { title: "پیش از سفارش موکت", tool: "/tools/carpet-estimator", items: ["ابعاد، شکل فضا و محل درگاه‌ها را ثبت کنید.", "موکت رول و تایلی را بر اساس کاربری و امکان تعویض مقایسه کنید.", "برش، دوردوزی، زیرسازی و نصب را جداگانه تأیید کنید."] },
  wallpaper: { title: "پیش از سفارش کاغذ دیواری", tool: "/tools/wallpaper-calculator", items: ["ابعاد دیوار، بازشوها و تکرار طرح را دقیق اندازه بگیرید.", "وضعیت زیرسازی و نیاز به ترمیم دیوار را روشن کنید.", "تعداد رول، چسب و اجرای طرح را پیش از خرید نهایی تأیید کنید."] },
  "interior-design": { title: "پیش از انتخاب طراح یا مجری", items: ["طراحی، اجرا و نظارت را در درخواست خود تفکیک کنید.", "محدودهٔ کار، زمان‌بندی و خروجی قابل تحویل را مکتوب کنید.", "نمونه‌کار واقعی مرتبط با نوع فضا را بررسی کنید."] },
  "smart-home": { title: "پیش از اجرای خانه هوشمند", tool: "/tools/smart-home-scope", items: ["دامنهٔ کار را بین روشنایی، پرده، امنیت و کنترل‌ها تفکیک کنید.", "وضعیت سیم‌کشی، اینترنت و امکان کنترل دستی را بررسی کنید.", "نصب، تنظیمات و پشتیبانی پس از اجرا را شفاف کنید."] },
  lighting: { title: "پیش از انتخاب نورپردازی", items: ["کاربری فضا و لایه‌های نور موردنیاز را مشخص کنید.", "منبع نور، مصرف انرژی و امکان نگهداری را مقایسه کنید.", "طراحی نور را از اجرای برق و نصب تجهیزات تفکیک کنید."] },
};

async function getPageData(params: Params) {
  const data = resolveNationalDiscovery(params.city, params.category, BUSINESS_CATEGORIES);
  if (!data) return null;
  return { ...data, indexable: isIndexableNationalDiscoveryRoute(params.city, data.category.slug) };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = await getPageData(await params);
  if (!page) return { robots: { index: false, follow: false } };
  const title = `${page.category.label} در ${page.city.name} | خونه‌نما`;
  const description = `کسب‌وکارهای منتشرشدهٔ ${page.category.label} در ${page.city.name}؛ بررسی خدمات، محدودهٔ فعالیت و نمونه‌کارهای واقعی در خونه‌نما.`;
  return {
    title,
    description,
    alternates: { canonical: baseUrl + nationalDiscoveryPath(page.city.slug, page.category.slug) },
    robots: { index: page.indexable, follow: true },
  };
}

export default async function CityCategoryPage({ params }: { params: Promise<Params> }) {
  const route = await params;
  const page = await getPageData(route);
  if (!page) notFound();

  const businesses = await listPublishedBusinesses({ categorySlug: page.category.slug, exactCity: page.city.name, limit: 50 });
  const relatedGuides = guides.filter((guide) => guide.relatedCategory === `/category/${page.category.slug}`).slice(0, 3);
  const relatedCities = nationalDiscoveryCitiesForCategory(page.category.slug).filter((city) => city.slug !== page.city.slug).slice(0, 12);
  const decisionGuide = decisionGuides[page.category.slug];
  const pageUrl = baseUrl + nationalDiscoveryPath(page.city.slug, page.category.slug);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: baseUrl },
      { "@type": "ListItem", position: 2, name: page.category.label, item: `${baseUrl}/category/${page.category.slug}` },
      { "@type": "ListItem", position: 3, name: `${page.category.label} در ${page.city.name}`, item: pageUrl },
    ],
  };
  const collectionJsonLd = page.indexable ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl + "#webpage",
    url: pageUrl,
    name: `${page.category.label} در ${page.city.name}`,
    description: `فهرست غرفه‌های منتشرشدهٔ ${page.category.label} با فعالیت یا محدودهٔ خدمت واقعی در ${page.city.name}.`,
    inLanguage: "fa-IR",
    isPartOf: { "@id": baseUrl + "/#website" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: businesses.length,
      itemListElement: businesses.map((business, index) => ({
        "@type": "ListItem", position: index + 1, url: `${baseUrl}/business/${business.slug}`, name: business.name,
      })),
    },
  } : null;

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      {collectionJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }} />}
      <Header />
      <section className="inner-page national-discovery-page">
        <div className="shell">
          <nav className="national-discovery-breadcrumbs" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link><span aria-hidden="true">/</span><Link href={`/category/${page.category.slug}`}>{page.category.label}</Link><span aria-hidden="true">/</span><span>{page.city.name}</span>
          </nav>
          <header className="page-heading">
            <span className="section-kicker">کسب‌وکارهای منتشرشده</span>
            <h1>{page.category.label} در {page.city.name}</h1>
            <p>فروشگاه‌ها و متخصصانی را می‌بینید که شهر یا محدودهٔ خدمت {page.city.name} را در غرفهٔ منتشرشدهٔ خود ثبت کرده‌اند. قیمت، موجودی، زمان اجرا و محدوده را پیش از سفارش مستقیم تأیید کنید.</p>
          </header>

          {businesses.length ? (
            <section className="national-discovery-section" aria-labelledby="businesses-title">
              <h2 id="businesses-title">فروشندگان و متخصصان مرتبط</h2>
              <div className="local-intent-grid">
                {businesses.map((business) => (
                  <article className="local-intent-card" key={business.slug}>
                    <h3><Link href={`/business/${business.slug}`}>{business.name}</Link></h3>
                    <p>{business.description.slice(0, 240)}</p>
                    <p className="national-discovery-location">{[business.city, business.area].filter(Boolean).join("، ")}</p>
                    <Link href={`/business/${business.slug}`}>مشاهده اطلاعات و نمونه‌کار</Link>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="national-discovery-section category-empty glass-panel" aria-label="نبود غرفهٔ مرتبط">
              <strong>فهرست غرفهٔ محلی هنوز کامل نیست.</strong>
              <p>
                برای تصمیم‌گیری از راهنمای انتخاب و ابزارهای این صفحه استفاده کنید؛ با افزودن غرفه‌های واقعی،
                فهرست همین‌جا کامل‌تر می‌شود.
              </p>
            </section>
          )}

          <section className="national-discovery-section" aria-labelledby="services-title">
            <h2 id="services-title">خدمات مرتبط</h2>
            <ul className="national-discovery-service-list">{page.category.services.slice(0, 12).map((service) => <li key={service}>{service}</li>)}</ul>
            <p><Link href={`/category/${page.category.slug}`}>راهنمای دسته و خدمات مرتبط</Link></p>
          </section>

          {decisionGuide && <section className="national-discovery-section" aria-labelledby="decision-title">
            <h2 id="decision-title">{decisionGuide.title} در {page.city.name}</h2>
            <ul className="national-discovery-service-list">{decisionGuide.items.map((item) => <li key={item}>{item}</li>)}</ul>
            {decisionGuide.tool && <p><Link href={decisionGuide.tool}>استفاده از ابزار برآورد اولیه</Link></p>}
          </section>}

          {relatedGuides.length > 0 && <section className="national-discovery-section" aria-labelledby="guides-title">
            <h2 id="guides-title">راهنماهای مرتبط پیش از انتخاب</h2>
            <ul className="national-discovery-link-list">{relatedGuides.map((guide) => <li key={guide.slug}><Link href={`/magazine/${guide.slug}`}>{guide.title}</Link></li>)}</ul>
          </section>}

          {relatedCities.length > 0 && <section className="national-discovery-section" aria-labelledby="cities-title">
            <h2 id="cities-title">این خدمات در شهرهای دیگر</h2>
            <nav className="national-discovery-city-links" aria-label="انتخاب شهر">
              {relatedCities.map((city) => <Link key={city.slug} href={nationalDiscoveryPath(city.slug, page.category.slug)}>{page.category.label} در {city.name}</Link>)}
            </nav>
          </section>}

          <section className="national-discovery-section national-discovery-seller" aria-labelledby="seller-title">
            <h2 id="seller-title">فعالیت شما در {page.city.name} است؟</h2>
            <p>صاحبان کسب‌وکارهای واقعی می‌توانند خدمات و محدودهٔ فعالیت خود را در خونه‌نما معرفی کنند.</p>
            <Link className="pill-button dark" href="/for-business">آشنایی با معرفی کسب‌وکار</Link>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
