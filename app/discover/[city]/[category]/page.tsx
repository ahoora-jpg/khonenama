import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BUSINESS_CATEGORIES } from "@/lib/business-taxonomy";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";

const cities: Record<string, string> = {
  tehran: "تهران", mashhad: "مشهد", isfahan: "اصفهان",
  shiraz: "شیراز", tabriz: "تبریز", karaj: "کرج",
  rasht: "رشت", ahvaz: "اهواز", qom: "قم",
  yazd: "یزد", kerman: "کرمان", hamedan: "همدان",
  qazvin: "قزوین", arak: "اراک", urmia: "ارومیه",
  kermanshah: "کرمانشاه", bandarabbas: "بندرعباس",
  sari: "ساری", gorgan: "گرگان", bushehr: "بوشهر",
  sanandaj: "سنندج", ardabil: "اردبیل", zanjan: "زنجان",
  birjand: "بیرجند", bojnurd: "بجنورد", ilam: "ایلام",
  khorramabad: "خرم‌آباد", shahrekord: "شهرکرد",
  yasuj: "یاسوج", zahedan: "زاهدان",
  semnan: "سمنان",
};

type Params = { city: string; category: string };
function resolve(params: Params) {
  const city = cities[params.city];
  const category = BUSINESS_CATEGORIES.find(item => item.slug === params.category);
  if (!city || !category) return null;
  return { city, category };
}
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const data = resolve(p);
  if (!data) return { robots: { index: false, follow: false } };
  const title = `${data.category.label} در ${data.city} | خونه‌نما`;
  const description = `فروشندگان و خدمات واقعی ${data.category.label} در ${data.city} را در خونه‌نما بررسی کنید؛ خدمات، محدوده فعالیت و نمونه‌کارها را مقایسه کنید.`;
  // These initial discovery pages need editorial review and internal links
  // before they can be individually approved for indexing.
  return {
    title, description,
    alternates: { canonical: `/discover/${p.city}/${p.category}` },
    robots: { index: false, follow: true },
  };
}
export default async function CityCategoryPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const data = resolve(p);
  if (!data) notFound();
  const businesses = await listPublishedBusinesses({
    categorySlug: data.category.slug, city: data.city, limit: 50,
  });
  return (
    <main>
      <Header />
      <section className="inner-page">
        <div className="shell">
          <nav aria-label="مسیر صفحه">
            <Link href="/">خانه</Link> / <Link href={`/category/${data.category.slug}`}>{data.category.label}</Link> / {data.city}
          </nav>
          <h1>{data.category.label} در {data.city}</h1>
          <p>کسب‌وکارهای منتشرشده با فعالیت یا محدوده خدمات ثبت‌شده در {data.city} را بررسی کنید. وجود هر خدمت، قیمت یا موجودی را مستقیماً از فروشنده تأیید کنید.</p>
          {businesses.length ? (
            <section aria-label="کسب‌وکارهای مرتبط">
              <h2>فروشندگان و متخصصان مرتبط</h2>
              <div className="local-intent-grid">
                {businesses.map(b => (
                  <article className="local-intent-card" key={b.slug}>
                    <h3><Link href={`/business/${b.slug}`}>{b.name}</Link></h3>
                    <p>{b.description.slice(0, 240)}</p>
                    <p>{b.city}{b.area ? `، ${b.area}` : ""}</p>
                    <Link href={`/business/${b.slug}`}>مشاهده اطلاعات و نمونه‌کار</Link>
                  </article>
                ))}
              </div>
            </section>
          ) : <p>در حال حاضر کسب‌وکار منتشرشده‌ای برای این ترکیب پیدا نشد. می‌توانید دسته‌های مرتبط و راهنماهای موجود را بررسی کنید.</p>}
          <section>
            <h2>خدمات مرتبط</h2>
            <ul>{data.category.services.slice(0, 12).map(service => <li key={service}>{service}</li>)}</ul>
            <p><Link href={`/category/${data.category.slug}`}>راهنمای دسته و خدمات مرتبط</Link></p>
            <p><Link href="/tools">ابزارهای محاسبه و برنامه‌ریزی</Link></p>
          </section>
          <section>
            <h2>فعالیت شما در {data.city} است؟</h2>
            <p>صاحبان کسب‌وکارهای واقعی می‌توانند خدمات و محدوده فعالیت خود را در خونه‌نما معرفی کنند.</p>
            <Link href="/for-business">آشنایی با معرفی کسب‌وکار</Link>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
