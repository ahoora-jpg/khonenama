"use client";
import {useEffect,useState} from 'react';
const labels:Record<string,string>={created:'ایجادشده',redirected:'ارجاع به درگاه',pending:'در انتظار نتیجه',verified:'تأییدشده درگاه',failed:'ناموفق',cancelled:'لغوشده',refunded:'بازپرداخت‌شده'};
type Payment={id:number,status:string,amount:number,currency:string,provider_reference:string,invoice_number:string,business_name:string,requested_at:string};
export default function AdminPayments(){
  const [rows,setRows]=useState<Payment[]>([]),[message,setMessage]=useState('در حال دریافت پرداخت‌ها…');
  useEffect(()=>{fetch('/api/admin/payments',{cache:'no-store'}).then(async r=>{if(r.status===401){window.location.href='/admin/login';return;}if(!r.ok)throw Error();const d=await r.json();setRows(d.payments);setMessage(d.payments.length?'':'هنوز پرداختی ثبت نشده است.');}).catch(()=>setMessage('دریافت پرداخت‌ها انجام نشد.'));},[]);
  return <section className="dashboard-panel glass-panel" dir="rtl"><h2>آخرین پرداخت‌ها</h2><p>اشتراک خریداری‌شده فقط با تأیید معتبر درگاه به‌صورت خودکار فعال می‌شود. هدیه مدیریتی، پرداخت و درآمد محسوب نمی‌شود.</p>{message&&<p>{message}</p>}<div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'right'}}><thead><tr><th>کسب‌وکار</th><th>صورتحساب</th><th>مبلغ</th><th>وضعیت</th><th>شماره پیگیری</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.business_name||'—'}</td><td>{p.invoice_number}</td><td>{Number(p.amount).toLocaleString('fa-IR')} {p.currency==='IRT'?'تومان':p.currency==='IRR'?'ریال':p.currency}</td><td>{labels[p.status]||p.status}</td><td>{p.provider_reference||'—'}</td></tr>)}</tbody></table></div></section>;
}
