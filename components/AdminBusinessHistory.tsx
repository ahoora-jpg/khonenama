"use client";
import {useState} from 'react';
const labels:Record<string,string>={complimentary_plan:'تغییر اشتراک توسط مدیر',remove:'تعلیق',restore:'رفع تعلیق',purge:'حذف دائمی'};
export default function AdminBusinessHistory({id}:{id:number}){
  const [rows,setRows]=useState<{action:string,reason:string,created_at:string}[]>([]),[message,setMessage]=useState(''),[loaded,setLoaded]=useState(false);
  async function load(){if(loaded)return;setMessage('در حال دریافت…');try{const r=await fetch('/api/admin/businesses/'+id+'/history',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();setRows(d.actions);setMessage(d.offer?'هدیه ثبت‌نام: '+Number(d.offer.benefit_days).toLocaleString('fa-IR')+' روز':d.actions.length?'':'هنوز اقدام مدیریتی ثبت نشده است.');setLoaded(true);}catch{setMessage('دریافت سابقه انجام نشد.');}}
  function reason(value:string){try{const r=JSON.parse(value);return (r.planCode==='free'?'بازگشت به پایه':r.planCode==='premium'?'اشتراک ویژه':'اشتراک حرفه‌ای')+'، '+Number(r.durationDays).toLocaleString('fa-IR')+' روز، '+(r.note||'بدون توضیح');}catch{return value;}}
  return <details onToggle={e=>{if(e.currentTarget.open)void load();}}><summary>سوابق هدیه و مدیریت</summary>{message&&<p>{message}</p>}{rows.map((r,index)=><p key={index}>{labels[r.action]||r.action} · {new Date(r.created_at.replace(' ','T')+'Z').toLocaleString('fa-IR')} · {reason(r.reason||'')}</p>)}</details>;
}
