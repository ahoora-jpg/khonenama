"use client";
import {useEffect,useState} from "react";
type Notice={warning:boolean;expired:boolean;remainingDays:number|null;previousPlan:string|null;endsAt:string|null};
export default function SubscriptionExpiryNotice(){
 const [notice,setNotice]=useState<Notice|null>(null),[open,setOpen]=useState(false);
 useEffect(()=>{let alive=true;async function check(){try{const r=await fetch('/api/me/business/subscription-status',{cache:'no-store'});if(!r.ok)return;const n=await r.json();if(!alive)return;setNotice(n);if(n.warning){const day=new Date(n.serverNow).toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'});const key=n.previousPlan+':'+n.endsAt+':'+day+':'+n.expired;let dismissed=false;try{dismissed=localStorage.getItem('khonenama-expiry-dismissed')===key;}catch{}setOpen(!dismissed);}}catch{}}void check();const timer=setInterval(check,60000);const focus=()=>void check();window.addEventListener('focus',focus);return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',focus);};},[]);
 if(!notice?.warning)return null;
 const name=notice.previousPlan==='premium'?'ویژه':'حرفه‌ای';
 const text=notice.expired?'اعتبار '+name+' شما پایان یافته و حساب به پایه برگشته است. فقط ۱۰ عکس اولِ بارگذاری‌شده نمایش عمومی دارند.':'تا پایان اعتبار '+name+' شما '+notice.remainingDays+' روز باقی مانده است. پس از پایان، حساب به پایه برمی‌گردد و فقط ۱۰ عکس اولِ بارگذاری‌شده نمایش عمومی خواهند داشت.';
 function dismiss(){try{const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'});localStorage.setItem('khonenama-expiry-dismissed',notice!.previousPlan+':'+notice!.endsAt+':'+day+':'+notice!.expired);}catch{}setOpen(false);}
 const content=<><h2>اعتبار اشتراک شما</h2><p>{text}</p><p>کاور و پروفایل جدا هستند. عکس‌ها و آلبوم‌های اضافه حذف نمی‌شوند؛ با تمدید دوباره در دسترس قرار می‌گیرند.</p><a className="pill-button dark" href="/dashboard/billing">مشاهده و تمدید اشتراک</a></>;
 return <><section className="dashboard-panel glass-panel" role="status">{content}</section>{open&&<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',padding:16}}><section role="dialog" aria-modal="true" aria-label="هشدار پایان اشتراک" className="dashboard-panel glass-panel" style={{background:'white',maxWidth:480,maxHeight:'90vh',overflow:'auto'}}>{content}<button className="pill-button" type="button" autoFocus onClick={dismiss}>متوجه شدم</button></section></div>}</>;
}
