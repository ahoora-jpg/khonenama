"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Contact={id:string;phone_e164:string;display_name:string;kind:string;source:string;consent_status:string};
type Message={id:string;phone_e164:string;category:string;status:string;body:string;created_at:string};
type Inbound={id:string;sender_e164:string;body:string;received_at:string};
type Dashboard={ok:boolean;counts:{status:string;count:number}[];contacts:Contact[];messages:Message[];agent:{last_seen_at:string|null;enabled:number;gateway_enabled:number}|null;summary:{opt_outs:number;priority_queued:number;consented_contacts:number}};

const labels:Record<string,string>={queued:"در صف",leased:"در اختیار عامل",submitted:"پذیرفته‌شده توسط گوشی",processed:"پردازش‌شده",sent:"ارسال‌شده",delivered:"تحویل‌شده",failed:"ناموفق",unknown:"وضعیت نامشخص",cancelled:"لغوشده"};
const errors:Record<string,string>={INVALID_PHONE:"شماره همراه معتبر نیست.",INVALID_MESSAGE:"اطلاعات پیام کامل یا معتبر نیست.",PROMOTIONAL_CONSENT_REQUIRED:"برای این مخاطب رضایت تبلیغاتی معتبر ثبت نشده است.",EVIDENCE_REQUIRED:"روش، نسخهٔ متن و مرجع سند رضایت را وارد کنید.",SMS_OPERATION_FAILED:"ثبت عملیات انجام نشد. دوباره تلاش کنید.",CANNOT_CANCEL:"این پیام دیگر قابل لغو نیست."};
const formatDate=(value:string|null|undefined)=>value?new Date(value.endsWith("Z")?value:value.replace(" ","T")+"Z").toLocaleString("fa-IR"):"ثبت نشده";

export default function SmsCenter(){
  const [data,setData]=useState<Dashboard|null>(null);
  const [error,setError]=useState("");
  const [phone,setPhone]=useState("");
  const [name,setName]=useState("");
  const [contactId,setContactId]=useState("");
  const [body,setBody]=useState("");
  const [reason,setReason]=useState("");
  const [category,setCategory]=useState("transactional");
  const [evidence,setEvidence]=useState("");
  const [consentVersion,setConsentVersion]=useState("");
  const [busy,setBusy]=useState(false);
  const pendingKey=useRef(crypto.randomUUID());
  const [smsKey,setSmsKey]=useState("");
  const [inbox,setInbox]=useState<Inbound[]>([]);
  const refresh=useCallback(async()=>{
    try{const [response,inboxResponse]=await Promise.all([fetch("/api/admin/sms",{cache:"no-store"}),fetch("/api/admin/sms/inbox",{cache:"no-store"})]);const next=await response.json();if(!response.ok)throw Error(response.status===401?"برای مشاهدهٔ مرکز پیامک، ابتدا وارد مدیریت سایت و سپس مرکز پیامک شوید.":"داده‌های مرکز پیامک در دسترس نیست.");setData(next);if(inboxResponse.ok)setInbox((await inboxResponse.json()).messages||[]);setError("");}
    catch(e){setError((e as Error).message);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function action(payload:Record<string,unknown>){
    setBusy(true);
    try{const response=await fetch("/api/admin/sms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw Error(result.error||"عملیات انجام نشد.");setError("");await refresh();return result;}
    catch(e){setError(errors[(e as Error).message]||"عملیات انجام نشد. اطلاعات را بررسی کنید.");return null;}
    finally{setBusy(false);}
  }
  const counts=Object.fromEntries((data?.counts||[]).map(v=>[v.status,v.count]));
  return <section dir="rtl" aria-label="مرکز پیامک خونه‌نما" style={{padding:"2rem 0",maxWidth:1100,margin:"auto"}}>
    <h1>مرکز پیامک خونه‌نما</h1>
    <p>وضعیت پذیرش در گوشی، ارسال و تحویل جداگانه ثبت می‌شود. پیام‌های دارای وضعیت نامشخص خودکار دوباره ارسال نمی‌شوند.</p>
    {error&&<p role="alert" style={{color:"#a12c20"}}>{error}</p>}
    {!data&&<form onSubmit={async e=>{e.preventDefault();const response=await fetch("/api/admin/sms/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:smsKey})});setSmsKey("");if(response.ok){await refresh();window.dispatchEvent(new Event("sms-admin-ready"));}else setError("ورود انجام نشد. دسترسی مدیریت سایت و کلید مستقل مرکز پیامک را بررسی کنید.");}}>
      <label>کلید دسترسی مرکز پیامک <input type="password" value={smsKey} onChange={e=>setSmsKey(e.target.value)} required autoComplete="off" /></label> <button>ورود</button>
    </form>}
    {data&&<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBlock:24}}>
      {(["queued","submitted","sent","delivered","failed","unknown"] as const).map(status=><div key={status} style={{padding:16,border:"1px solid #ddd",borderRadius:12,background:"#fff"}}><strong>{labels[status]}</strong><div style={{fontSize:28}}>{counts[status]??0}</div></div>)}
    </div>
    <p>در صف با اولویت عملیاتی: {data.summary?.priority_queued??0} · مخاطبان دارای رضایت: {data.summary?.consented_contacts??0} · لغو عضویت‌ها: {data.summary?.opt_outs??0}</p>
    <p>عامل ارتباطی: {data?.agent?.enabled&&data.agent.gateway_enabled&&data.agent.last_seen_at&&Date.now()-Date.parse(data.agent.last_seen_at.replace(" ","T")+"Z")<120000?"متصل":"قطع یا غیرفعال"} · آخرین ارتباط: {formatDate(data?.agent?.last_seen_at)}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:24,marginBlock:24}}>
      <form onSubmit={async e=>{e.preventDefault();const result=await action({action:"contact",phone,name});if(result){setContactId(result.id);setPhone("");setName("");}}}>
        <h2>مخاطب جدید</h2>
        <label>شماره همراه<input value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="0912…" style={{display:"block",width:"100%"}} /></label>
        <label>نام نمایشی<input value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%"}} /></label>
        <p>ثبت شماره، رضایت تبلیغاتی محسوب نمی‌شود.</p><button disabled={busy}>ثبت مخاطب</button>
      </form>
      <form onSubmit={async e=>{e.preventDefault();const expiry=new Date(Date.now()+24*3600_000).toISOString();const result=await action({action:"queue",contactId,body,category,reason,expiresAt:expiry,idempotencyKey:pendingKey.current});if(result){setBody("");setReason("");pendingKey.current=crypto.randomUUID();}}}>
        <h2>ثبت پیام در صف</h2>
        <label>مخاطب<select value={contactId} onChange={e=>setContactId(e.target.value)} required style={{display:"block",width:"100%"}}><option value="">انتخاب کنید</option>{data?.contacts.map(c=><option key={c.id} value={c.id}>{c.display_name||"مخاطب"} · {c.phone_e164}</option>)}</select></label>
        <label>نوع پیام<select value={category} onChange={e=>setCategory(e.target.value)} style={{display:"block",width:"100%"}}><option value="transactional">عملیاتی</option><option value="promotional">تبلیغاتی، فقط با رضایت مستند</option></select></label>
        {category==="transactional"&&<label>دلیل پیام عملیاتی<input value={reason} onChange={e=>setReason(e.target.value)} required maxLength={120} style={{display:"block",width:"100%"}} /></label>}
        <label>متن<textarea value={body} onChange={e=>setBody(e.target.value)} required maxLength={1000} style={{display:"block",width:"100%",minHeight:100}} /></label>
        <button disabled={busy}>ثبت در صف</button>
      </form>
      <form onSubmit={async e=>{e.preventDefault();await action({action:"consent",contactId,status:"granted",method:"admin_verified",textVersion:consentVersion,evidenceRef:evidence});}}>
        <h2>ثبت رضایت تبلیغاتی</h2>
        <p>فقط پس از مشاهدهٔ سند رضایتِ روشنِ همین مخاطب ثبت شود.</p>
        <label>مخاطب<select value={contactId} onChange={e=>setContactId(e.target.value)} required style={{display:"block",width:"100%"}}><option value="">انتخاب کنید</option>{data?.contacts.map(c=><option key={c.id} value={c.id}>{c.display_name||"مخاطب"} · {c.phone_e164}</option>)}</select></label>
        <label>نسخه متن رضایت<input value={consentVersion} onChange={e=>setConsentVersion(e.target.value)} required style={{display:"block",width:"100%"}} /></label>
        <label>مرجع سند رضایت<input value={evidence} onChange={e=>setEvidence(e.target.value)} required style={{display:"block",width:"100%"}} /></label>
        <button disabled={busy}>ثبت رضایت مستند</button>
      </form>
    </div>
    <h2>آخرین پیام‌ها</h2>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"right"}}><thead><tr><th>مخاطب</th><th>نوع</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody>{data?.messages.map(m=><tr key={m.id}><td>{m.phone_e164}</td><td>{m.category==="promotional"?"تبلیغاتی":"عملیاتی"}</td><td>{labels[m.status]||"نامشخص"}</td><td>{formatDate(m.created_at)}</td><td>{m.status==="queued"&&<button disabled={busy} onClick={()=>void action({action:"cancel",id:m.id})}>لغو</button>}</td></tr>)}</tbody></table></div>
    <h2>مخاطبان و رضایت</h2>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"right"}}><thead><tr><th>نام</th><th>شماره</th><th>رضایت تبلیغاتی</th><th>عملیات</th></tr></thead><tbody>{data?.contacts.map(c=><tr key={c.id}><td>{c.display_name||"—"}</td><td>{c.phone_e164}</td><td>{c.consent_status==="granted"?"دارای رضایت":c.consent_status==="revoked"?"لغوشده":"فاقد رضایت"}</td><td>{c.consent_status==="granted"&&<button disabled={busy} onClick={()=>void action({action:"consent",contactId:c.id,status:"revoked",method:"admin_manual",textVersion:"optout-v1",evidenceRef:"admin_request:"+new Date().toISOString()})}>لغو عضویت</button>}</td></tr>)}</tbody></table></div>
    <h2>پیام‌های دریافتی</h2>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"right"}}><thead><tr><th>فرستنده</th><th>پیش‌نمایش متن</th><th>زمان</th></tr></thead><tbody>{inbox.map(m=><tr key={m.id}><td>{m.sender_e164}</td><td>{m.body}</td><td>{formatDate(m.received_at)}</td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
