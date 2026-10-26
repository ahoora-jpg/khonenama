"use client";
import {useEffect,useState} from "react";
type Template={code:string;category:string;body:string;enabled:number};
export default function SmsTemplates(){
  const [items,setItems]=useState<Template[]>([]),[code,setCode]=useState(""),[body,setBody]=useState(""),[category,setCategory]=useState("transactional"),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  const [authorized,setAuthorized]=useState(false);
  const [liveSendingEnabled,setLiveSendingEnabled]=useState(false);
  async function refresh(){try{const response=await fetch("/api/admin/sms/templates",{cache:"no-store"});setAuthorized(response.ok);if(response.ok){const data=await response.json();setItems(data.templates||[]);setLiveSendingEnabled(data.liveSendingEnabled===true);}}catch{setNotice("دریافت قالب‌ها انجام نشد.");}}
  useEffect(()=>{void refresh();const listener=()=>void refresh();window.addEventListener("sms-admin-ready",listener);return()=>window.removeEventListener("sms-admin-ready",listener);},[]);
  async function act(payload:Record<string,unknown>){setBusy(true);try{const response=await fetch("/api/admin/sms/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!response.ok)throw Error("ثبت قالب انجام نشد.");setNotice("ثبت شد.");await refresh();return true;}catch(e){setNotice((e as Error).message);return false;}finally{setBusy(false);}}
  if(!authorized)return null;
  return <section id="sms-templates" dir="rtl" style={{maxWidth:1100,margin:"2rem auto",padding:"1rem",border:"1px solid #ddd",borderRadius:16}}>
    <h2>قالب پیام‌ها</h2><p>قالب تازه یا ویرایش‌شده غیرفعال می‌شود. پیام‌های خودکار فقط پس از فعال‌سازی آگاهانهٔ قالب ایجاد می‌شوند.</p>
    {notice&&<p role="status">{notice}</p>}
    {!liveSendingEnabled&&<p className="sms-setup-banner">در حالت آماده‌سازی، قالب‌ها ذخیره می‌شوند و امکان فعال‌سازی ندارند.</p>}
    <form onSubmit={async e=>{e.preventDefault();if(await act({code,body,category})){setCode("");setBody("");}}}>
      <label>شناسه قالب <input value={code} onChange={e=>setCode(e.target.value)} pattern="[a-z0-9_]{2,60}" required placeholder="quote_received"/></label>
      <label>نوع <select value={category} onChange={e=>setCategory(e.target.value)}><option value="transactional">عملیاتی</option><option value="promotional">تبلیغاتی</option></select></label>
      <label style={{display:"block"}}>متن قالب <textarea value={body} onChange={e=>setBody(e.target.value)} required maxLength={1000} style={{display:"block",width:"100%",minHeight:80}}/></label>
      <p>شناسه‌های خودکار متصل به سایت: <code>quote_received</code> با متغیر <code>{"{{leadId}}"}</code>، و <code>payment_verified</code> با متغیر <code>{"{{plan}}"}</code>.</p>
      <button disabled={busy}>ذخیره به‌صورت غیرفعال</button>
    </form>
    <h3>قالب‌های ثبت‌شده</h3>
    <div className="sms-table-scroll"><table style={{width:"100%",textAlign:"right"}}><thead><tr><th>شناسه</th><th>نوع</th><th>متن</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{items.map(t=><tr key={t.code}><td>{t.code}</td><td>{t.category==="transactional"?"عملیاتی":"تبلیغاتی"}</td><td>{t.body}</td><td>{t.enabled?"فعال":"غیرفعال"}</td><td><button disabled={busy} onClick={()=>{setCode(t.code);setBody(t.body);setCategory(t.category);}}>ویرایش</button><button disabled={busy||(!t.enabled&&!liveSendingEnabled)} onClick={()=>void act({action:"toggle",code:t.code,confirm:t.enabled?"DISABLE":"ENABLE"})}>{t.enabled?"غیرفعال‌سازی":"فعال‌سازی"}</button></td></tr>)}{!items.length&&<tr><td colSpan={5}>هنوز قالبی ثبت نشده است.</td></tr>}</tbody></table></div>
  </section>;
}
