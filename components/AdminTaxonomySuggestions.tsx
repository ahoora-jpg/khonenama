"use client";
import { useEffect, useState } from "react";

type Suggestion = {id:number; kind:string; proposed_name:string; normalized_name:string|null; status:string; business_name:string; selected_categories:string};
export default function AdminTaxonomySuggestions() {
  const [interest,setInterest]=useState<{topic:string;searches:number;noResults:number;guideSlugs:string[]}[]>([]);
  const [items,setItems]=useState<Suggestion[]>([]);
  const [message,setMessage]=useState("");
  const [names,setNames]=useState<Record<number,string>>({});
  const [busy,setBusy]=useState<number|null>(null);
  async function load() {
    try {
      const response=await fetch("/api/admin/taxonomy-suggestions",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error();
      setItems(data.suggestions); setInterest(data.searchInterest||[]);
    } catch {setMessage("دریافت پیشنهادها انجام نشد.");}
  }
  useEffect(()=>{void load();},[]);
  async function review(item:Suggestion,status:"reviewed"|"rejected") {
    setBusy(item.id);
    try {
      const response=await fetch("/api/admin/taxonomy-suggestions",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id,status,normalizedName:names[item.id]??item.normalized_name??item.proposed_name})});
      if(!response.ok)throw new Error();
      setMessage("نتیجه بررسی ذخیره شد. افزودن به فهرست مشترک نیازمند به‌روزرسانی دسته‌بندی و انتشار آن است.");
      await load();
    } catch {setMessage("ثبت بررسی انجام نشد.");} finally {setBusy(null);}
  }
  return <section className="dashboard-panel glass-panel">
    <h2>موضوع‌های جست‌وجوشده در ۳۰ روز اخیر</h2><p>فقط موضوع‌های عمومی شناخته‌شده شمرده می‌شوند؛ متن خام، شماره، نام و نشانی مشتری ذخیره نمی‌شود. این تعداد جست‌وجوی سایت است، نه آمار گوگل یا کل بازار. موضوع‌های بدون راهنما برای بررسی محتوا اولویت دارند؛ مقاله یا خدمت خودکار منتشر نمی‌شود.</p>{!interest.length&&<p>هنوز داده کافی ثبت نشده است.</p>}{interest.map(row=><article key={row.topic} className="category-seo-copy-card"><h3>{row.topic}</h3><p>{row.searches.toLocaleString("fa-IR")} جست‌وجو · {row.noResults.toLocaleString("fa-IR")} بار بدون غرفه واقعی مرتبط</p>{row.guideSlugs.length?row.guideSlugs.map(slug=><a key={slug} href={"/magazine/"+slug}>راهنمای موجود · </a>):<strong>نیازمند بررسی و تدوین راهنما</strong>}</article>)}<h2>پیشنهاد دسته و خدمات کاربران</h2>
    <p>نام، املا، دسته والد و هم‌پوشانی با خدمات موجود را بررسی کنید. بررسی‌شده به معنی افزوده‌شدن خودکار به فهرست عمومی نیست.</p>
    <button type="button" onClick={()=>void load()}>تازه‌سازی پیشنهادها</button>
    {message&&<p role="status">{message}</p>}
    {!items.length&&<p>پیشنهادی دریافت نشده است.</p>}
    {items.map(item=><article key={item.id} className="category-seo-copy-card">
      <h3>{item.proposed_name}</h3>
      <p>{item.business_name} · {item.kind==="category"?"دسته":"خدمت"} · {item.status==="pending"?"در انتظار بررسی":item.status==="reviewed"?"بررسی‌شده، نیازمند انتشار":"ردشده"}</p>
      <p>دسته‌های انتخاب‌شده: {item.selected_categories}</p>
      <label>نام اصلاح‌شده<input maxLength={120} value={names[item.id]??item.normalized_name??item.proposed_name} onChange={event=>setNames({...names,[item.id]:event.target.value})}/></label>
      <button type="button" disabled={busy===item.id} onClick={()=>void review(item,"reviewed")}>ثبت بررسی و نام صحیح</button>
      <button type="button" disabled={busy===item.id} onClick={()=>void review(item,"rejected")}>رد پیشنهاد</button>
    </article>)}
  </section>;
}
