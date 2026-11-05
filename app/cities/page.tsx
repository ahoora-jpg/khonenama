import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "جستجوی فروشگاه‌ها و خدمات دکوراسیون در شهرهای ایران | خونه‌نما",
  description: "دسترسی به جستجوی فروشگاه‌های پرده، موکت، کفپوش، کاغذ دیواری، طراحی داخلی و خانه هوشمند در شهرهای ایران.",
  alternates: { canonical: "https://khonenama.ir/cities" },
};

const cities = [
  "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "رشت",
  "قم", "کرمانشاه", "ارومیه", "یزد", "کرمان", "زاهدان", "همدان",
  "قزوین", "اراک", "ساری", "بندرعباس", "سنندج", "خرم‌آباد", "گرگان",
  "بوشهر", "بیرجند", "شهرکرد", "بجنورد", "ایلام", "یاسوج",
  "زنجان", "اردبیل", "کاشان",
] as const;

const categories = [
  { label: "پرده و ملزومات", query: "پرده" },
  { label: "موکت", query: "موکت" },
  { label: "کفپوش و پارکت", query: "کفپوش" },
  { label: "کاغذ دیواری", query: "کاغذ دیواری" },
  { label: "طراحی داخلی", query: "طراحی داخلی" },
  { label: "خانه هوشمند", query: "خانه هوشمند" },
] as const;

function searchHref(city: string, query: string) {
  return "/search?" + new URLSearchParams({ q: query, location: city }).toString();
}

export default function CitiesPage() {
  return (
    <main>
      <Header />
      <section className="inner-page">
        <div className="shell">
          <div className="page-heading">
            <span className="section-kicker">پوشش کشوری خونه‌نما</span>
            <h1>جستجوی دکوراسیون داخلی در شهرهای ایران</h1>
            <p>شهر و زمینه موردنظر خود را انتخاب کنید تا کسب‌وکارهای منتشرشده مرتبط را ببینید. ممکن است در برخی شهرها هنوز نتیجه‌ای ثبت نشده باشد.</p>
          </div>
          <div className="local-intent-grid">
            {cities.map((city) => (
              <section className="local-intent-card" key={city}>
                <h2>{city}</h2>
                <p>جستجوی فروشگاه‌ها و خدمات دکوراسیون در {city}</p>
                <ul>
                  {categories.map((category) => (
                    <li key={category.query}>
                      <Link href={searchHref(city, category.query)}>{category.label} در {city}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p>برای آشنایی با انواع محصولات و خدمات، <Link href="/category/curtain">راهنمای دسته پرده</Link> و <Link href="/tools">ابزارهای محاسبه</Link> را ببینید.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
