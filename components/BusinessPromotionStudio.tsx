"use client";
import {useEffect,useState} from "react";
import type {StoryTemplate} from "@/lib/story-templates";

type Photo={id:number;file_url:string;thumbnail_url?:string;alt_text:string};
export default function BusinessPromotionStudio(){
 const [data,setData]=useState<any>(null),[photos,setPhotos]=useState<Photo[]>([]),[photo,setPhoto]=useState(0),[template,setTemplate]=useState(1);
 const [format,setFormat]=useState<"story"|"card">("story"),[exportType,setExportType]=useState<"png"|"jpg">("png");
 const [tagline,setTagline]=useState(""),[title,setTitle]=useState(""),[features,setFeatures]=useState(["","",""]);
 const [cropX,setCropX]=useState(50),[cropY,setCropY]=useState(50),[preview,setPreview]=useState<{png:string;jpg:string}|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;Promise.all([fetch("/api/me/business/promotion",{cache:"no-store"}),fetch("/api/me/business/media",{cache:"no-store"})]).then(async([p,m])=>{
   const result=await p.json();if(!p.ok)throw new Error(p.status===403?"ابزار تبلیغ غرفه با پلن حرفه‌ای یا ویژه فعال است.":"دریافت ابزار تبلیغ انجام نشد؛ دوباره تلاش کنید.");
   const media=await m.json();if(!m.ok)throw new Error("دریافت عکس‌ها انجام نشد؛ دوباره تلاش کنید.");
   const images=(media.media||[]).filter((item:any)=>item.kind!=="video"&&item.kind!=="logo"&&item.file_url);
   if(active){setData(result);setPhotos(images);setPhoto(images[0]?.id||0);setTemplate(result.availableTemplates[0]?.id||1);}
 }).catch(error=>{if(active)setMessage(error.message);});return()=>{active=false;};},[]);
 useEffect(()=>{setPreview(null);},[photo,template,format,tagline,title,features,cropX,cropY]);
 async function generate(){
   if(!photo){setMessage("یک عکس از گالری غرفه انتخاب کنید.");return;}
   setBusy(true);setMessage("");
   try{
     const response=await fetch(`/api/me/business/promotion?template=${template}&image=${photo}`,{cache:"no-store"});const current=await response.json();
     if(!response.ok)throw new Error(current.error==="IMAGE_NOT_OWNED"?"عکس انتخابی در گالری شما نیست؛ صفحه را دوباره باز کنید.":"دسترسی این قالب فعال نیست؛ وضعیت اشتراک را بررسی کنید.");
     const design=current.availableTemplates.find((t:StoryTemplate)=>t.id===template);if(!design||!current.selectedImage)throw new Error("قالب یا عکس انتخابی در دسترس نیست.");
     const qrResponse=await fetch("/api/me/business/qr",{cache:"no-store"});if(!qrResponse.ok)throw new Error("دریافت QR معتبر انجام نشد؛ دوباره تلاش کنید.");
     const qr=URL.createObjectURL(await qrResponse.blob());
     try{const {renderStory}=await import("@/lib/story-renderer");const result=await renderStory({template:design,vendor:current.business,photo:current.selectedImage.file_url,qr,brand:"/khonenama-logo.svg",tagline,title,features,cropX:cropX/100,cropY:cropY/100,format});setPreview(result);setData(current);if(result.lowResolution)setMessage("ابعاد عکس انتخابی کم است؛ ممکن است کیفیت خروجی کاهش پیدا کند. برای نتیجه بهتر عکس بزرگ‌تری انتخاب کنید.");}
     finally{URL.revokeObjectURL(qr);}
   }catch(error){setMessage(error instanceof Error?error.message:"ساخت تصویر انجام نشد؛ دوباره تلاش کنید.");void fetch("/api/me/business/promotion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({template,error:"RENDER_FAILED"})}).catch(()=>{});}finally{setBusy(false);}
 }
 return <section className="dashboard-panel glass-panel" dir="rtl"><h2>ابزار تبلیغ غرفه</h2>
 {data&&<><p>ساخت استوری اینستاگرام و کارت معرفی با عکس‌ها و اطلاعات واقعی غرفهٔ شما.</p>
 <label>نوع تصویر<select disabled={busy} value={format} onChange={e=>setFormat(e.target.value as "story"|"card")}><option value="story">استوری عمودی ۹:۱۶</option><option value="card">کارت معرفی مربعی</option></select></label>
 <label>انتخاب قالب<select disabled={busy} value={template} onChange={e=>setTemplate(Number(e.target.value))}>{data.availableTemplates.map((t:StoryTemplate)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
 <label>عکس غرفه<select disabled={busy} value={photo} onChange={e=>setPhoto(Number(e.target.value))}><option value={0}>انتخاب عکس</option>{photos.map((p,i)=><option key={p.id} value={p.id}>{p.alt_text||`عکس ${(i+1).toLocaleString("fa-IR")}`}</option>)}</select></label>
 {photo>0&&<><img src={photos.find(p=>p.id===photo)?.thumbnail_url||photos.find(p=>p.id===photo)?.file_url} alt="عکس انتخابی برای استوری" style={{width:"100%",maxHeight:240,objectFit:"contain"}}/><details><summary>تنظیم محل برش عکس</summary><label>جابه‌جایی افقی<input disabled={busy} type="range" min={0} max={100} value={cropX} onChange={e=>setCropX(Number(e.target.value))}/></label><label>جابه‌جایی عمودی<input disabled={busy} type="range" min={0} max={100} value={cropY} onChange={e=>setCropY(Number(e.target.value))}/></label></details></>}
 <details><summary>متن‌های اختیاری</summary><label>شعار کوتاه<input disabled={busy} maxLength={70} value={tagline} onChange={e=>setTagline(e.target.value)}/></label><label>عنوان محصول یا خدمت<input disabled={busy} maxLength={70} value={title} onChange={e=>setTitle(e.target.value)}/></label>{features.map((value,i)=><label key={i}>ویژگی واقعی {(i+1).toLocaleString("fa-IR")}<input disabled={busy} maxLength={65} value={value} onChange={e=>setFeatures(previous=>previous.map((v,j)=>j===i?e.target.value:v))}/></label>)}<p className="field-hint">فقط ویژگی‌ها و شرایط واقعی کسب‌وکارتان را بنویسید.</p></details>
 <button type="button" className="pill-button dark" disabled={busy||!photo||!data.availableTemplates.length} onClick={generate}>{busy?"در حال ساخت…":"ساخت پیش‌نمایش"}</button>
 <a className="pill-button" href="/api/me/business/qr" target="_blank" rel="noopener">دریافت QR غرفه</a>
 {preview&&<div><img src={preview[exportType]} alt="پیش‌نمایش تصویر معرفی غرفه" style={{width:"100%",maxWidth:320,height:"auto"}}/><label>فرمت دانلود<select value={exportType} onChange={e=>setExportType(e.target.value as "png"|"jpg")}><option value="png">PNG</option><option value="jpg">JPG</option></select></label><a className="pill-button" href={preview[exportType]} download={`khonenama-${format}.${exportType}`}>دانلود تصویر</a></div>}
 <p className="field-hint">فایل را دانلود و در اینستاگرام منتشر کنید. QR و لینک تبلیغاتی پس از پایان دورهٔ دسترسی غیرفعال می‌شوند.</p></>}
 {message&&<p role="status">{message}</p>}</section>;
}
