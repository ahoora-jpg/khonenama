"use client";
import { useEffect, useRef, useState } from "react";
export default function BusinessWelcomeTrial(){
 const [data,setData]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{fetch('/api/me/business/welcome-trial',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setData).catch(()=>{});},[]);
 useEffect(()=>{if(data?.showNotice)button.current?.focus();},[data]);
 async function dismiss(){setBusy(true);setError("");try{const r=await fetch('/api/me/business/welcome-trial',{method:'POST'});if(!r.ok)throw Error();setData({...data,showNotice:false});window.dispatchEvent(new Event('khonenama-business-updated'));}catch{setError('بستن اعلان ذخیره نشد؛ دوباره تلاش کنید.');}finally{setBusy(false);}}
 if(!data?.showNotice)return null;
 return <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',padding:20}}><section role="dialog" aria-modal="true" aria-labelledby="welcome-trial-title" dir="rtl" style={{position:'relative',width:'100%',maxWidth:460,padding:32,borderRadius:24,background:'var(--surface, #fff)',color:'#24352c',boxShadow:'0 20px 80px #0003',fontFamily:'inherit'}} onKeyDown={e=>{if(e.key==='Escape'&&!busy)void dismiss();if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}>
 <button aria-label="بستن اعلان" disabled={busy} onClick={dismiss} style={{position:'absolute',top:8,left:8,fontSize:28,width:44,height:44,border:0,background:'transparent'}}>×</button>
 <h2 id="welcome-trial-title" style={{fontSize:24,marginBottom:16}}>یک ماه مهمان خونه‌نما باشید</h2>
 <p style={{fontSize:17,lineHeight:1.9}}>پروفایل کسب‌وکارتان را تکمیل کنید و به مدت ۳۰ روز، رایگان از امکانات پلن ویژه استفاده کنید.</p>
 {data.trial&&<p style={{fontSize:16}}>دوره شما فعال است؛ پایان دوره: {new Date(data.trial.ends_at.replace(' ','T')+'Z').toLocaleDateString('fa-IR')}</p>}
 <p style={{fontSize:16,lineHeight:1.8}}>بدون پرداخت و تمدید خودکار. پس از پایان دوره، غرفه با پلن رایگان ادامه می‌دهد.</p>
 {error&&<p role="alert">{error}</p>}
 <button ref={button} className="button primary" disabled={busy} onClick={dismiss}>{busy?'در حال ذخیره…':'متوجه شدم'}</button>
 </section></div>;
}
