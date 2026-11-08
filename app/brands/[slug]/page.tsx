import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpLeft, ExternalLink, MapPin, Store } from "lucide-react";
import { getPublicBrand, listBusinessesForBrand } from "@/lib/server/public-brands";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const brand = await getPublicBrand((await params).slug);
  if (!brand) return {};
  return { title: brand.name + " | برندهای دکوراسیون خونه نما", description: brand.description || "اطلاعات برند " + brand.name + " و غرفه‌های مرتبط در خونه نما.", alternates: { canonical: "/brands/" + brand.slug } };
}
export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const brand = await getPublicBrand((await params).slug); if (!brand) notFound();
  const businesses = await listBusinessesForBrand(brand.id);
  return <main><Header /><section className="inner-page brand-detail-page"><div className="shell">
    <nav className="guide-breadcrumb" aria-label="مسیر صفحه"><a href="/">خونه نما</a><span>/</span><a href="/brands">برندها</a><span>/</span><span>{brand.name}</span></nav>
    <section className="brand-detail-hero glass-panel"><span className="section-kicker">برند دکوراسیون</span><h1>{brand.name}</h1><p>{brand.description || "اطلاعات اولیه این برند و مسیرهای رسمی آن."}</p><div className="brand-category-links">{brand.categories.map((category) => <a key={category.slug} href={"/category/" + category.slug}>{category.name}</a>)}</div>{brand.officialUrl && <a className="pill-button dark" href={brand.officialUrl} target="_blank" rel="nofollow noopener noreferrer">وب‌سایت رسمی <ExternalLink size={16} /></a>}</section>
    {brand.references.length > 0 && <section className="brand-references"><div className="section-heading compact-heading"><div><span className="section-kicker">منابع رسمی</span><h2>محصولات و کاتالوگ‌ها</h2></div></div><div className="brand-reference-grid">{brand.references.map((reference) => <a key={reference.sourceUrl} className="brand-reference-card glass-panel" href={reference.sourceUrl} target="_blank" rel="nofollow noopener noreferrer"><small>{reference.type === "catalogue" ? "کاتالوگ رسمی" : reference.type === "product_page" ? "محصول" : reference.type === "category_page" ? "دسته محصول" : "وب‌سایت رسمی"}</small><h3>{reference.title}</h3><span>مشاهده منبع <ExternalLink size={15} /></span></a>)}</div><p className="brand-source-note">این صفحه فایل، تصویر یا کاتالوگ برند را بازنشر نمی‌کند؛ پیوندها شما را به منبع رسمی می‌برند.</p></section>}
    <section className="brand-booths" id="booths"><div className="section-heading compact-heading"><div><span className="section-kicker">غرفه‌های مرتبط</span><h2>فروشگاه‌ها و متخصصان {brand.name}</h2></div></div>{businesses.length ? <div className="business-grid">{businesses.map((business) => <a className="business-card" key={business.id} href={"/business/" + business.slug}><div className="business-content"><h3>{business.name}</h3><p>{business.description || "غرفه منتشرشده در خونه نما"}</p><div className="business-meta-row"><span><MapPin size={14} /> {business.city}، {business.area}</span></div></div></a>)}</div> : <div className="category-empty glass-panel"><Store size={24} /><strong>هنوز غرفه‌ای این برند را انتخاب نکرده است.</strong><p>صاحبان غرفه می‌توانند هنگام ثبت یا ویرایش غرفه، برندهایی را که عرضه یا اجرا می‌کنند انتخاب کنند.</p><a className="pill-button dark" href="/register-business">ساخت غرفه <ArrowUpLeft size={16} /></a></div>}</section>
  </div></section><Footer /></main>;
}
