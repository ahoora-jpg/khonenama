"use client";
import {useEffect,useState} from 'react';
export default function BusinessInstallmentToggle(){
 const [enabled,setEnabled]=useState(false),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;fetch('/api/me/business',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(active){setEnabled(d.business?.showInstallments===true);setLoaded(true);}}).catch(()=>{if(active)setMessage('دریافت وضعیت فروش اقساطی انجام نشد؛ صفحه را تازه کنید.');});return()=>{active=false;};},[]);
 async function change(value:boolean){setBusy(true);setMessage('');try{const r=await fetch('/api/me/business',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'installments',showInstallments:value})});if(!r.ok)throw Error();setEnabled(value);setMessage(value?'نشان فروش اقساطی روی غرفه فعال شد.':'نشان فروش اقساطی از غرفه برداشته شد.');}catch{setMessage('ذخیره انجام نشد؛ دوباره تلاش کنید.');}finally{setBusy(false);}}
 return <div className="dashboard-panel glass-panel" aria-label="فروش اقساطی"><label><input type="checkbox" checked={enabled} disabled={!loaded||busy} onChange={e=>void change(e.target.checked)}/> نمایش نشان «فروش اقساطی» روی غرفه</label><p>اگر فروش یا خدمات اقساطی دارید، این گزینه را فعال کنید. با برداشتن تیک، نشان از کاور حذف می‌شود. شرایط اقساط را در معرفی غرفه توضیح دهید.</p>{message&&<p role="status">{message}</p>}</div>;
}
