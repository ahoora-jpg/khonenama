import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { serviceCatalog, servicePath, findService, MIN_SERVICE_BUSINESSES } from "@/lib/service-catalog";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
export const dynamic = "force-dynamic";
type Params = Promise<{category: string; service: string}>;
const getBusinesses = cache((category: string, serviceName: string) => listPublishedBusinesses({categorySlug: category, serviceName, limit: 50}));
export async function generateMetadata({params}: {params: Params}): Promise<Metadata> {
 const p=await params; const item=findService(p.category,p.service); if(!item) return {};
 const businesses=await getBusinesses(item.category,item.name);
 return {title: item.name + " | مقایسه کسب‌وکارها و استعلام | خونه نما", description: "برای " + item.name + " مشخصات، شرایط خرید یا اجرا و غرفه‌های مرتبط را بررسی کنید. " + item.description, alternates: {canonical: servicePath(item)}, robots: {index: businesses.length >= MIN_SERVICE_BUSINESSES, follow: true}};
}
export default async function ServicePage({params}: {params: Params}) {
 const p=await params; const item=findService(p.category,p.service); if(!item) notFound();
 const businesses=await getBusinesses(item.category,item.name);
 const siblings=serviceCatalog.filter(x=>x.category===item.category&&x.group===item.group&&x.name!==item.name).slice(0,8);
 return <><Header/><main className="page-shell" dir="rtl"><section className="category-results"><a href={"/category/"+item.category}>راهنما و خدمات این حوزه</a><h1>{item.name}؛ انتخاب کسب‌وکار و استعلام</h1><p>{item.description}</p><p>انتخاب این مورد توسط صاحب غرفه، معرفی زمینه فعالیت اوست؛ موجودی، قیمت، زمان تحویل و محدوده خدمات را مستقیماً تأیید کنید.</p><a href={"/magazine/"+item.guide}>راهنمای انتخاب و بررسی مشخصات</a></section><section className="category-results" id="businesses"><h2>غرفه‌های مرتبط با {item.name}</h2>{businesses.length ? <div className="local-intent-grid">{businesses.map(b=><article className="local-intent-card" key={b.id}><h3><a href={"/business/"+b.slug}>{b.name}</a></h3><p>{b.city}{b.area?"، "+b.area:""}</p><p>{b.description.slice(0,240)}</p><a href={"/business/"+b.slug}>مشاهده غرفه و راه تماس</a></article>)}</div>:<p>هنوز غرفه منتشرشده‌ای با این خدمت در این فهرست نداریم. راهنمای مرتبط را بخوانید یا دیگر خدمات این حوزه را بررسی کنید.</p>}</section><section className="category-results"><h2>موارد مرتبط</h2><ul>{siblings.map(x=><li key={x.name}><a href={servicePath(x)}>{x.name}</a></li>)}</ul><a href="/help">راهنمای مقایسه پیشنهادها و بررسی تحویل</a></section></main><Footer/></>;
}
