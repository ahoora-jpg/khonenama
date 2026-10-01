"use client";
import {useEffect,useState} from 'react';
export default function LaunchOfferBanner(){
  const [offer,setOffer]=useState<{benefit_days:number,enrollment_ends_at:string}|null>(null);
  useEffect(()=>{fetch('/api/launch-offer',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>setOffer(d?.offer||null)).catch(()=>{});},[]);
  if(!offer)return null;
  const deadline=new Date(offer.enrollment_ends_at.replace(' ','T')+'Z');
  return <aside className="dashboard-panel glass-panel" dir="rtl"><strong>پیشنهاد آغاز فعالیت: {offer.benefit_days.toLocaleString('fa-IR')} روز اشتراک حرفه‌ای رایگان</strong><p>اولین کسب‌وکار خود را تا {deadline.toLocaleString('fa-IR')} ثبت کنید. هدیه از زمان ثبت‌نام آغاز می‌شود؛ پس از پایان آن، امکانات پایه رایگان باقی می‌ماند و ادامه اشتراک حرفه‌ای نیاز به خرید دارد.</p></aside>;
}
