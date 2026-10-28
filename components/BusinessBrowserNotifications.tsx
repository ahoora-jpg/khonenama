"use client";
import {useEffect,useRef,useState} from "react";
export default function BusinessBrowserNotifications(){
 const [status,setStatus]=useState(""),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[newCount,setNewCount]=useState(0);
 const known=useRef<Set<number>|null>(null);
 useEffect(()=>{
  let stopped=false;
  async function check(){if(document.visibilityState==="hidden")return;try{const r=await fetch("/api/me/business/leads",{cache:"no-store"});if(!r.ok)return;const data=await r.json();if(stopped||!Array.isArray(data.leads))return;const ids=new Set<number>(data.leads.map((lead:any)=>Number(lead.id)));if(known.current){const fresh=[...ids].filter(id=>!known.current!.has(id));if(fresh.length){setNewCount(count=>count+fresh.length);window.dispatchEvent(new Event("khonenama-new-request"));}}known.current=ids;}catch{}}
  void check();const timer=window.setInterval(check,30000);window.addEventListener("focus",check);
  if("serviceWorker" in navigator)void navigator.serviceWorker.getRegistration("/").then(reg=>reg?.pushManager.getSubscription()).then(async sub=>{if(sub){const saved=await fetch("/api/me/business/web-push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sub.toJSON())});if(!stopped)setEnabled(saved.ok);}else if(!stopped)setEnabled(false);}).catch(()=>{});
  return()=>{stopped=true;clearInterval(timer);window.removeEventListener("focus",check);};
 },[]);
 async function toggle(){
  setBusy(true);setStatus("");
  try{
   if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window))throw Error("UNSUPPORTED");
   if(enabled){const reg=await navigator.serviceWorker.getRegistration("/");const sub=await reg?.pushManager.getSubscription();if(sub){const r=await fetch("/api/me/business/web-push",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:sub.endpoint})});if(!r.ok)throw Error("SAVE");await sub.unsubscribe();}setEnabled(false);setStatus("اعلان این مرورگر غیرفعال شد.");return;}
   if(!window.confirm("می‌خواهید اعلان درخواست مشتری را دریافت کنید؟\n\nاگر مشتری از طریق خونه‌نما برای غرفهٔ شما درخواست ثبت کند، یک اعلان واضح دریافت می‌کنید تا سریع‌تر پاسخ بدهید. این اجازه را هر زمان بخواهید می‌توانید غیرفعال کنید. اعلان تبلیغاتی ارسال نمی‌شود."))return;
   const permission=await Notification.requestPermission();if(permission!=="granted")throw Error("PERMISSION");
   const r=await fetch("/api/me/business/web-push",{cache:"no-store"});if(!r.ok)throw Error("SAVE");const {publicKey}=await r.json();
   const reg=await navigator.serviceWorker.register("/business-notifications-sw.js",{scope:"/"});await navigator.serviceWorker.ready;
   const raw=atob(publicKey.replace(/-/g,"+").replace(/_/g,"/"));const key=Uint8Array.from(raw,c=>c.charCodeAt(0));
   const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   const saved=await fetch("/api/me/business/web-push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sub.toJSON())});if(!saved.ok)throw Error("SAVE");
   setEnabled(true);setStatus("اعلان درخواست‌های این غرفه برای این مرورگر فعال شد.");
  }catch(error){const code=error instanceof Error?error.message:"";setStatus(code==="PERMISSION"?"اجازه اعلان داده نشد؛ از تنظیمات مرورگر اجازه دهید.":code==="UNSUPPORTED"?"مرورگر اعلان وب را پشتیبانی نمی‌کند. در آیفون سایت را به صفحه اصلی اضافه کنید یا از اپ استفاده کنید.":"فعال‌سازی اعلان انجام نشد؛ اتصال و اجازه مرورگر را بررسی و دوباره تلاش کنید.");}finally{setBusy(false);}
 }
 async function testNotification(){
  setBusy(true);
  try{const reg=await navigator.serviceWorker.getRegistration("/");const sub=await reg?.pushManager.getSubscription();if(!sub)throw Error("DEVICE");const r=await fetch("/api/me/business/notifications/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"web",endpoint:sub.endpoint}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(r.status===429?"LIMIT":"SEND");setStatus("اعلان آزمایشی برای سرویس اعلان ارسال شد؛ دریافت آن را روی گوشی بررسی کنید.");}catch(e){setStatus(e instanceof Error&&e.message==="LIMIT"?"برای آزمون بعدی یک دقیقه صبر کنید.":"اعلان آزمایشی ارسال نشد؛ اتصال و اجازه اعلان را بررسی کنید.");}finally{setBusy(false);}
 }
 return <aside className="dashboard-card" aria-label="اعلان درخواست مشتری"><strong>اعلان درخواست‌های مشتری</strong><p>برای دریافت خبر درخواست جدید، اعلان این مرورگر را فعال کنید.</p><button type="button" className="button button-primary" disabled={busy} onClick={toggle}>{busy?"در حال تنظیم…":enabled?"غیرفعال‌کردن اعلان این مرورگر":"فعال‌کردن اعلان"}</button>{enabled&&<button type="button" className="button button-primary" disabled={busy} onClick={testNotification}>ارسال اعلان آزمایشی</button>}{status&&<p role="status">{status}</p>}{newCount>0&&<div role="status" className="business-request-toast"><a href="#leads" onClick={()=>setNewCount(0)}>{newCount.toLocaleString("fa-IR")} درخواست جدید؛ مشاهده صندوق غرفه</a><button type="button" onClick={()=>setNewCount(0)} aria-label="بستن اعلان">×</button></div>}</aside>;
}
