import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { serviceCatalog, servicePath, findService, MIN_SERVICE_BUSINESSES } from "@/lib/service-catalog";
import { listServiceBusinessSummaries } from "@/lib/server/service-business-summaries";
import { contentPaths } from "@/lib/content-paths";
import { getGuide } from "@/lib/guides";
export const dynamic = "force-dynamic";
type Params = Promise<{category: string; service: string}>;
const getBusinesses = cache((category: string, serviceName: string) => listServiceBusinessSummaries(serviceName,50));
export async function generateMetadata({params}: {params: Params}): Promise<Metadata> {
 const p=await params; const item=findService(p.category,p.service); if(!item) return {};
 const businesses=await getBusinesses(item.category,item.name);
 const title = item.name + " | مقایسه کسب‌وکارها و استعلام | خونه نما";
 const description = "برای " + item.name + " مشخصات، شرایط خرید یا اجرا و غرفه‌های مرتبط را بررسی کنید. " + item.description;
 const url = "https://khonenama.ir" + servicePath(item);
 return {
  title: {absolute: title},
  description,
  alternates: {canonical: servicePath(item)},
  robots: {index: businesses.length >= MIN_SERVICE_BUSINESSES, follow: true},
  openGraph: {title, description, url, locale: "fa_IR", type: "website"},
  twitter: {card: "summary", title, description},
 };
}
export default async function ServicePage({params}: {params: Params}) {
 const p=await params; const item=findService(p.category,p.service); if(!item) notFound();
 const primary=serviceCatalog.find(entry=>entry.name===item.name)!; if(primary.category!==p.category) permanentRedirect(servicePath(primary));
 const businesses=await getBusinesses(item.category,item.name);
 const siblings=serviceCatalog.filter(x=>x.category===item.category&&x.group===item.group&&x.name!==item.name).slice(0,8);
 const readingPath=contentPaths.find(path=>path.id===item.category);
 const supportingArticle=getGuide(item.guide);
 const serviceUrl="https://khonenama.ir"+servicePath(item);
 const itemListJsonLd={
  "@context":"https://schema.org",
  "@type":"ItemList",
  "@id":serviceUrl+"#businesses",
  name:"کسب‌وکارهای مرتبط با "+item.name,
  numberOfItems:businesses.length,
  itemListElement:businesses.map((b,index)=>({
   "@type":"ListItem",
   position:index+1,
   item:{
    "@type":"LocalBusiness",
    name:b.name,
    url:"https://khonenama.ir/business/"+b.slug,
    address:{"@type":"PostalAddress",addressLocality:b.city,streetAddress:b.area||undefined,addressCountry:"IR"}
   }
  }))
 };
 const collectionJsonLd={
  "@context":"https://schema.org",
  "@type":"CollectionPage",
  "@id":serviceUrl+"#webpage",
  url:serviceUrl,
  name:item.name+"؛ انتخاب کسب‌وکار و استعلام",
  description:item.description,
  isPartOf:{"@id":"https://khonenama.ir/#website"},
  about:{"@type":"Service",name:item.name,serviceType:item.name},
  mainEntity:{"@id":serviceUrl+"#businesses"},
  publisher:{"@id":"https://khonenama.ir/#organization"}
 };
 const breadcrumbJsonLd={
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  itemListElement:[
   {"@type":"ListItem",position:1,name:"خونه نما",item:"https://khonenama.ir/"},
   {"@type":"ListItem",position:2,name:"دسته خدمات",item:"https://khonenama.ir/category/"+item.category},
   {"@type":"ListItem",position:3,name:item.name,item:serviceUrl}
  ]
 };
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(collectionJsonLd).replace(/</g,"\\u003c")}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(itemListJsonLd).replace(/</g,"\\u003c")}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbJsonLd).replace(/</g,"\\u003c")}}/><Header/><main className="page-shell" dir="rtl"><nav className="guide-breadcrumb" aria-label="مسیر صفحه"><a href="/">خونه نما</a><span>/</span><a href={"/category/"+item.category}>راهنما و خدمات این حوزه</a><span>/</span><span>{item.name}</span></nav><section className="category-results"><a href={"/category/"+item.category}>راهنما و خدمات این حوزه</a><h1>{item.name}؛ انتخاب کسب‌وکار و استعلام</h1><p>{item.description}</p><p>انتخاب این مورد توسط صاحب غرفه، معرفی زمینه فعالیت اوست؛ موجودی، قیمت، زمان تحویل و محدوده خدمات را مستقیماً تأیید کنید.</p><a href={item.guide?"/magazine/"+item.guide:"/magazine"}>{supportingArticle?.title || "راهنمای انتخاب و بررسی مشخصات " + item.name}</a></section>{readingPath && <section className="category-results"><h2>پیش از استعلام چه چیزی آماده کنیم؟</h2><ul>{readingPath.checklist.map(text=><li key={text}>{text}</li>)}</ul><a href={"/magazine#guide-path-"+readingPath.id}>مسیر آموزش، اندازه‌گیری و انتخاب {readingPath.name}</a></section>}<section className="category-results" id="businesses"><h2>غرفه‌های مرتبط با {item.name}</h2>{businesses.length ? <div className="local-intent-grid">{businesses.map(b=><article className="local-intent-card" key={b.id}><h3><a href={"/business/"+b.slug}>{b.name}</a></h3><p>{b.city}{b.area?"، "+b.area:""}</p><p>{b.description.slice(0,240)}</p><a href={"/business/"+b.slug}>مشاهده غرفه و راه تماس</a></article>)}</div>:<p>هنوز غرفه منتشرشده‌ای با این خدمت در این فهرست نداریم. راهنمای مرتبط را بخوانید یا دیگر خدمات این حوزه را بررسی کنید.</p>}</section><section className="category-results"><h2>موارد مرتبط</h2><ul>{siblings.map(x=><li key={x.name}><a href={servicePath(x)}>{x.name}</a></li>)}</ul><a href="/help">راهنمای مقایسه پیشنهادها و بررسی تحویل</a></section></main><Footer/></>;
}
