import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listPublicBrands } from "@/lib/server/public-brands";
import { ArrowUpLeft, Building2, Tags } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "برندهای دکوراسیون | خونه نما", description: "برندهای شناخته‌شده پرده، کفپوش، موکت و دیوارپوش را ببینید و غرفه‌های عرضه‌کننده هر برند را پیدا کنید.", alternates: { canonical: "/brands" } };
export default async function BrandsPage() {
  const brands = await listPublicBrands();
  return <main><Header /><section className="inner-page brands-page"><div className="shell">
    <div className="brands-hero glass-panel"><span className="section-kicker">راهنمای انتخاب برند</span><h1>برندهای دکوراسیون</h1><p>دسته‌های محصول، مرجع رسمی و غرفه‌های عرضه‌کننده هر برند را در یک‌جا ببینید. حضور یک نام در این فهرست به‌تنهایی به معنی نمایندگی رسمی هیچ غرفه‌ای نیست.</p></div>
    {brands.length ? <div className="brands-grid">{brands.map((brand) => <a className="brand-card glass-panel" key={brand.slug} href={"/brands/" + brand.slug}><div className="brand-card-icon"><Building2 size={24} /></div><div><h2>{brand.name}</h2><p>{brand.description || "اطلاعات اولیه برند و مسیرهای رسمی آن."}</p></div><div className="brand-card-tags">{brand.categories.map((category) => <span key={category.slug}><Tags size={13} /> {category.name}</span>)}</div><span className="brand-card-link">مشاهده برند <ArrowUpLeft size={16} /></span></a>)}</div> : <div className="category-empty glass-panel"><strong>فهرست برندها در حال آماده‌سازی است.</strong><p>پس از اجرای به‌روزرسانی داده‌ها، برندهای اولیه اینجا ظاهر می‌شوند.</p></div>}
  </div></section><Footer /></main>;
}
