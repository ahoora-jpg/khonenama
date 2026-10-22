"use client";
import {useEffect,useState} from "react";

type Details={business:{name:string;phone?:string;instagram?:string;city?:string;area?:string}};
type Selection={limit:number;selected:number[]};
function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("دریافت تصویر انجام نشد."));img.src=src;});}
async function makeStory(id:number, business:Details["business"], qrUrl:string, watermark:boolean){
  await document.fonts.load('32px "DigiHamishe"');
  const [design,qr]=await Promise.all([loadImage(`/images/story-prepared/${String(id).padStart(2,"0")}.webp`),loadImage(qrUrl)]);
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;
  const c=canvas.getContext("2d");if(!c)throw new Error("ساخت تصویر در مرورگر ممکن نیست.");
  c.drawImage(design,0,0,1080,1920);
  c.drawImage(qr,790,1606,170,170);
  c.fillStyle="rgba(255,255,255,.92)";c.beginPath();c.roundRect(155,1586,560,245,16);c.fill();
  c.fillStyle="#102332";c.textAlign="right";c.direction="rtl";
  c.fillStyle="rgba(255,255,255,.92)";c.beginPath();c.roundRect(155,1285,560,64,16);c.fill();
  c.fillStyle="#102332";c.font='32px "DigiHamishe"';c.fillText(business.name,700,1328,525);
  const lines=[business.phone||"",business.instagram||"",[business.city,business.area].filter(Boolean).join("، ")];
  c.font='27px "DigiHamishe"';lines.forEach((value,index)=>c.fillText(value,700,1635+index*83,525));
  if(watermark){c.save();c.translate(540,960);c.rotate(-Math.PI/5);c.textAlign="center";c.font='bold 90px "DigiHamishe"';c.fillStyle="rgba(0,0,0,.48)";for(let y=-600;y<=600;y+=300)c.fillText("پیش‌نمایش",0,y);c.restore();}
  return canvas.toDataURL("image/png");
}
export default function PreparedStoryStudio(){
  const [details,setDetails]=useState<Details|null>(null),[selection,setSelection]=useState<Selection|null>(null),[id,setId]=useState(1),[preview,setPreview]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{let active=true;Promise.all([fetch("/api/me/business/promotion",{cache:"no-store"}),fetch("/api/me/business/story-selection",{cache:"no-store"})]).then(async([p,s])=>{if(!p.ok||!s.ok)throw new Error("این ابزار با اشتراک فعال حرفه‌ای یا ویژه در دسترس است.");const [d,v]=await Promise.all([p.json(),s.json()]);if(active){setDetails(d);setSelection(v);}}).catch(e=>{if(active)setMessage(e.message)});return()=>{active=false}},[]);
  useEffect(()=>{setPreview("");setMessage("");},[id]);
  async function generate(){if(!details||!selection)return;setBusy(true);setMessage("");try{
    const qrResponse=await fetch("/api/me/business/qr",{cache:"no-store"});if(!qrResponse.ok)throw new Error("دریافت کد غرفه ممکن نشد.");
    const qr=URL.createObjectURL(await qrResponse.blob());let result:string;
    try{result=await makeStory(id,details.business,qr,!selection.selected.includes(id))}finally{URL.revokeObjectURL(qr)}
    setPreview(result);
  }catch(e){setMessage(e instanceof Error?e.message:"ساخت استوری ممکن نشد.")}finally{setBusy(false)}}
  async function confirmSelection(){if(!selection||!preview)return;setBusy(true);setMessage("");try{
    const response=await fetch("/api/me/business/story-selection",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateId:id})});const current=await response.json();
    if(!response.ok){if(current.selected)setSelection(current);throw new Error(current.error==="LIMIT_REACHED"?"سهمیه انتخاب قالب این اشتراک تکمیل شده است.":"ثبت انتخاب ممکن نشد؛ دوباره تلاش کنید.");}
    setSelection(current);setPreview("");setMessage("انتخاب ثبت شد؛ برای ساخت نسخه قابل دانلود، پیش‌نمایش را دوباره باز کنید.");
  }catch(e){setMessage(e instanceof Error?e.message:"ثبت انتخاب ممکن نشد.")}finally{setBusy(false)}}
  return <section className="dashboard-panel glass-panel" dir="rtl"><h2>قالب‌های آمادهٔ استوری</h2>
    {selection&&<><p>از میان ۲۴ طرح انتخاب کنید. در این دورهٔ اشتراک، امکان انتخاب {selection.limit.toLocaleString("fa-IR")} طرح دارید؛ انتخاب ثبت‌شده تا پایان همین اشتراک قابل تغییر نیست.</p><p>انتخاب‌شده: {selection.selected.length.toLocaleString("fa-IR")} از {selection.limit.toLocaleString("fa-IR")}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10}}>{Array.from({length:24},(_,i)=>i+1).map(n=><button type="button" key={n} disabled={busy} onClick={()=>setId(n)} aria-pressed={id===n} style={{padding:4,border:id===n?"3px solid #aa7d39":"1px solid #ddd",borderRadius:8,background:"white"}}><img src={`/images/story-prepared/${String(n).padStart(2,"0")}.webp`} alt={`طرح استوری ${n.toLocaleString("fa-IR")}`} loading="lazy" style={{width:"100%",height:"auto",display:"block"}}/><span>{n.toLocaleString("fa-IR")}{selection.selected.includes(n)?" ✓":""}</span></button>)}</div>
    <button type="button" className="pill-button dark" disabled={busy} onClick={generate}>{busy?"لطفاً صبر کنید…":"نمایش پیش‌نمایش استوری"}</button>
    {preview&&<div><img src={preview} alt="پیش‌نمایش استوری غرفه" style={{width:"100%",maxWidth:320,height:"auto"}}/>{selection.selected.includes(id)?<a className="pill-button" href={preview} download={`khonenama-story-${id}.png`}>دانلود استوری</a>:<><p>پس از تأیید، این طرح یکی از انتخاب‌های اشتراک شما خواهد بود و تا پایان دوره قابل تغییر نیست.</p><button type="button" className="pill-button dark" disabled={busy||selection.selected.length>=selection.limit} onClick={confirmSelection}>تأیید انتخاب این طرح</button>{selection.selected.length>=selection.limit&&<p>سهمیه انتخاب شما تکمیل شده است. برای دانلود، یکی از طرح‌های انتخاب‌شده را باز کنید.</p>}</>}</div>}</>}
    {message&&<p role="status">{message}</p>}</section>;
}
