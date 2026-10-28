"use client";
import { useEffect, useRef, useState } from "react";
export default function BusinessWelcomeTrial(){
 const [data,setData]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{fetch('/api/me/business/welcome-trial',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setData).catch(()=>{});},[]);
 useEffect(()=>{if(data?.showNotice)button.current?.focus();},[data]);
 async function dismiss(){setBusy(true);setError("");try{const r=await fetch('/api/me/business/welcome-trial',{method:'POST'});if(!r.ok)throw Error();setData({...data,showNotice:false});window.dispatchEvent(new Event('khonenama-business-updated'));}catch{setError('بستن اعلان ذخیره نشد؛ دوباره تلاش کنید.');}finally{setBusy(false);}}
 if(!data?.showNotice)return null;
 return <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.5)',display:'grid',placeItems:'center',padding:16}}><section role="dialog" aria-modal="true" aria-label="پلن‌های خونه‌نما تا پایان ۱۵ بهمن رایگان هستند" dir="rtl" style={{position:'relative',width:'100%',maxWidth:640,maxHeight:'calc(100dvh - 32px)',overflowY:'auto',borderRadius:20,background:'#fffaf2',color:'#24352c',boxShadow:'0 20px 80px #0003',fontFamily:'inherit'}} onKeyDown={e=>{if(e.key==='Escape'&&!busy)void dismiss();if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}>
 <button aria-label="بستن اعلان" disabled={busy} onClick={dismiss} style={{position:'absolute',top:8,left:8,zIndex:1,fontSize:28,width:44,height:44,border:0,borderRadius:'50%',background:'#ffffffed',color:'#24352c'}}>×</button>
 <div style={{padding:'48px 24px 28px',textAlign:'center',background:'linear-gradient(135deg,#fff4df,#f7e2c5)'}}><strong style={{display:'block',fontSize:30}}>تا پایان ۱۵ بهمن، مهمان خونه‌نما باشید</strong><p style={{fontSize:18,lineHeight:2}}>پلن‌های حرفه‌ای و ویژه برای همهٔ غرفه‌ها رایگان هستند.</p></div>
 <div style={{padding:'14px 20px',textAlign:'center'}}>
 {error&&<p role="alert">{error}</p>}
 <button ref={button} className="button primary" disabled={busy} onClick={dismiss}>{busy?'در حال ذخیره…':'متوجه شدم'}</button>
 </div></section></div>;
}
