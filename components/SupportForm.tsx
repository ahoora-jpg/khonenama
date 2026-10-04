"use client";
import { useState } from "react";
export default function SupportForm({ businessSlug = "", reviewId }: { businessSlug?: string; reviewId?: number }) {
  const [contact,setContact] = useState(''),[message,setMessage] = useState(''),[result,setResult] = useState(''),[busy,setBusy] = useState(false);
  return <details className="marketplace-panel"><summary>گزارش مشکل یا درخواست پشتیبانی</summary><form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setResult('');
    try { const response = await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contact,message,businessSlug,reviewId})}); const data = await response.json(); if(!response.ok || !data.ok) throw new Error(); setResult('درخواست ثبت شد. کد پیگیری: '+data.code+'؛ برای پیگیری، این کد را در تماس با پشتیبانی اعلام کنید.'); setMessage(''); }
    catch { setResult('ثبت انجام نشد؛ اطلاعات را بررسی کنید یا کمی بعد دوباره تلاش کنید.'); } finally {setBusy(false);}
  }}><label>شماره یا ایمیل تماس<input required minLength={5} maxLength={150} value={contact} onChange={e=>setContact(e.target.value)} /></label><label>شرح مشکل<textarea required minLength={10} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} /></label><button disabled={busy}>{busy?'در حال ثبت…':'ثبت گزارش'}</button><p role="status">{result}</p></form></details>;
}
