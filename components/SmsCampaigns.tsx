"use client";
import {useEffect,useState} from "react";
import {estimateSms} from "@/lib/sms-text";

type Group={id:string;name:string};
type Campaign={id:string;name:string;body:string;status:string;max_recipients:number;group_count:number;eligible_count:number;queued_count:number};
type Contact={id:string;display_name:string;phone_e164:string};
export default function SmsCampaigns(){
  const [groups,setGroups]=useState<Group[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [groupName,setGroupName]=useState(""),[groupId,setGroupId]=useState("");
  const [name,setName]=useState(""),[body,setBody]=useState(""),[limit,setLimit]=useState(10),[schedule,setSchedule]=useState("");
  const [notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  const [contacts,setContacts]=useState<Contact[]>([]),[memberId,setMemberId]=useState("");
  const [authorized,setAuthorized]=useState(false);
  const [liveSendingEnabled,setLiveSendingEnabled]=useState(false);
  async function refresh(){try{const [response,people]=await Promise.all([fetch("/api/admin/sms/campaigns",{cache:"no-store"}),fetch("/api/admin/sms",{cache:"no-store"})]);const data=await response.json();setAuthorized(response.ok);if(response.ok){setGroups(data.groups);setCampaigns(data.campaigns);setLiveSendingEnabled(data.liveSendingEnabled===true);}if(people.ok)setContacts((await people.json()).contacts||[]);}catch{/* Main panel shows connection errors. */}}
  useEffect(()=>{void refresh();const listener=()=>void refresh();window.addEventListener("sms-admin-ready",listener);return()=>window.removeEventListener("sms-admin-ready",listener);},[]);
  async function act(fields:Record<string,unknown>){setBusy(true);try{const response=await fetch("/api/admin/sms/campaigns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(fields)});const data=await response.json();if(!response.ok)throw Error("عملیات انجام نشد؛ ورودی و وضعیت کمپین را بررسی کنید.");setNotice("ثبت شد.");await refresh();return data;}catch(e){setNotice((e as Error).message);return null;}finally{setBusy(false);}}
  async function importFile(file:File){const csv=await file.text();const data=await act({action:"importCsv",groupId,csv});if(data)setNotice(`${data.imported} مخاطب وارد شد؛ رضایت تبلیغاتی به‌صورت خودکار ثبت نشد. ${data.invalid} شماره نامعتبر بود.`);}
  const {parts}=estimateSms(body);
  if(!authorized)return null;
  return <section id="sms-campaigns" dir="rtl" style={{maxWidth:1100,margin:"2rem auto",padding:"1rem",border:"1px solid #ddd",borderRadius:16}}>
    <h2>گروه‌ها و کمپین‌ها</h2><p>فایل مخاطبان به‌تنهایی مجوز ارسال تبلیغاتی نیست. کمپین فقط مخاطبان دارای رضایت مستند را در زمان ارسال انتخاب می‌کند.</p>
    {!liveSendingEnabled&&<p className="sms-setup-banner">در مرحلهٔ بازبینی می‌توانید گروه و پیش‌نویس کمپین بسازید؛ تأیید و شروع ارسال غیرفعال است.</p>}
    {notice&&<p role="status">{notice}</p>}
    <form onSubmit={async e=>{e.preventDefault();const data=await act({action:"group",name:groupName});if(data){setGroupId(data.id);setGroupName("");}}}>
      <label>نام گروه <input value={groupName} onChange={e=>setGroupName(e.target.value)} required/></label> <button disabled={busy}>ساخت گروه</button>
    </form>
    <div style={{marginBlock:16}}><label>گروه <select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">انتخاب کنید</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <label style={{marginInline:12}}>افزودن مخاطب <select value={memberId} onChange={e=>setMemberId(e.target.value)}><option value="">انتخاب کنید</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.display_name||"مخاطب"} · {c.phone_e164}</option>)}</select></label>
      <button disabled={!groupId||!memberId||busy} onClick={()=>void act({action:"member",groupId,contactId:memberId})}>افزودن به گروه</button>
      <label style={{marginInline:12}}>ورود مخاطبان از CSV با ستون‌های phone,name <input type="file" accept=".csv,text/csv" disabled={!groupId||busy} onChange={e=>{const file=e.target.files?.[0];if(file)void importFile(file);}}/></label>
    </div>
    <form onSubmit={async e=>{e.preventDefault();const data=await act({action:"create",groupId,name,body,maxRecipients:limit,scheduledAt:schedule?new Date(schedule).toISOString():null});if(data){setName("");setBody("");setSchedule("");}}}>
      <h3>کمپین جدید</h3>
      <label>نام <input value={name} onChange={e=>setName(e.target.value)} required/></label>
      <label>سقف گیرندگان <input type="number" min={1} max={10000} value={limit} onChange={e=>setLimit(Number(e.target.value))}/></label>
      <label>زمان شروع (اختیاری) <input type="datetime-local" value={schedule} onChange={e=>setSchedule(e.target.value)}/></label>
      <label style={{display:"block"}}>متن <textarea value={body} onChange={e=>setBody(e.target.value)} required maxLength={1000} style={{display:"block",width:"100%",minHeight:90}}/></label>
      <p>برآورد بخش‌های پیامک: {parts.toLocaleString("fa-IR")} (وابسته به نویسه‌ها و اپراتور). برآورد هزینه: تعرفهٔ خط هنوز ثبت نشده است.</p>
      <button disabled={busy||!groupId}>ثبت پیش‌نویس</button>
    </form>
    <h3>فهرست کمپین‌ها</h3>
    <div className="sms-table-scroll"><table style={{width:"100%",textAlign:"right"}}><thead><tr><th>نام و متن</th><th>وضعیت</th><th>اعضای گروه</th><th>دارای رضایت</th><th>ثبت‌شده در صف</th><th>عملیات</th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id}><td><details><summary>{c.name}</summary><p>{c.body}</p></details></td><td>{({draft:"پیش‌نویس",approved:"تأییدشده",running:"در حال ثبت",paused:"متوقف",completed:"پایان‌یافته",cancelled:"لغوشده"} as Record<string,string>)[c.status]||c.status}</td><td>{c.group_count}</td><td>{c.eligible_count}</td><td>{c.queued_count} / {c.max_recipients}</td><td>{c.status==="draft"&&<button disabled={busy||!liveSendingEnabled} onClick={()=>{if(window.confirm("این کمپین با رضایت‌های ثبت‌شده وارد صف شود؟"))void act({action:"approve",id:c.id});}}>تأیید</button>}{c.status==="running"&&<button disabled={busy} onClick={()=>void act({action:"pause",id:c.id})}>توقف</button>}{c.status==="paused"&&<button disabled={busy||!liveSendingEnabled} onClick={()=>void act({action:"resume",id:c.id})}>ادامه</button>}{["draft","approved","running","paused"].includes(c.status)&&<button disabled={busy} onClick={()=>void act({action:"cancel",id:c.id})}>لغو</button>}</td></tr>)}{!campaigns.length&&<tr><td colSpan={6}>هنوز کمپینی ثبت نشده است.</td></tr>}</tbody></table></div>
  </section>;
}
