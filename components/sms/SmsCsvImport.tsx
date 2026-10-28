"use client";
import {useId,useState} from 'react';
import Link from 'next/link';
import {csvImportBatches,importCsvBatches} from '@/lib/sms-csv';
import {faNumber} from '@/lib/sms-admin-ui';
import {Field,smsApi,useSms,useSmsResource} from './SmsAdminShell';
type Checkpoint={next:number;imported:number;invalid:number};
export function SmsCsvImport({groupId,onImported}:{groupId?:string;onImported?:(id:string)=>void|Promise<void>}){
 const {notify,refresh}=useSms(),inputId=useId();
 const [selectedGroup,setSelectedGroup]=useState(''),[name,setName]=useState(''),[fileName,setFileName]=useState(''),[fileHash,setFileHash]=useState(''),[prepared,setPrepared]=useState<ReturnType<typeof csvImportBatches>|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState(''),[result,setResult]=useState(''),[importedGroup,setImportedGroup]=useState('');
 const groups=useSmsResource<{groups:{id:string;name:string}[]}>('/api/admin/sms/workspace?view=groups');
 async function choose(file:File){
  setPrepared(null);setResult('');setError('');setImportedGroup('');setProgress(0);setFileHash('');
  try{if(!/\.csv$/i.test(file.name))throw Error('لطفاً فایل CSV انتخاب کنید؛ فایل مستقیم اکسل پذیرفته نمی‌شود.');if(file.size>20_000_000)throw Error('حجم فایل باید کمتر از ۲۰ مگابایت باشد.');
   const content=await file.text(),parsed=csvImportBatches(content);setPrepared(parsed);setFileName(file.name);
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content));setFileHash(Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''));
   if(!name)setName(file.name.replace(/\.csv$/i,'').slice(0,100));
  }catch(err){setError((err as Error).message);}
 }
 async function start(){
  if(!prepared)return;setBusy(true);setError('');setResult('');let target=groupId||selectedGroup;
  try{
   if(!target){const created=await smsApi('/api/admin/sms/campaigns',{action:'group',name:name.trim()});target=created.id;setSelectedGroup(target);}
   const storageKey='kn_sms_csv_v2:'+target+':'+fileHash;let saved:Checkpoint={next:0,imported:0,invalid:0};
   try{const previous=JSON.parse(localStorage.getItem(storageKey)||'null');if(previous&&Number.isInteger(previous.next)&&previous.next>=0&&previous.next<=prepared.batches.length&&Number.isFinite(previous.imported)&&Number.isFinite(previous.invalid))saved=previous;}catch{}
   setProgress(saved.imported+saved.invalid);
   const totals=await importCsvBatches(prepared.batches,target,p=>smsApi('/api/admin/sms/campaigns',p),n=>setProgress(saved.imported+saved.invalid+n),{startAt:saved.next,onCheckpoint:(next,imported,invalid)=>{try{localStorage.setItem(storageKey,JSON.stringify({next,imported:saved.imported+imported,invalid:saved.invalid+invalid}));}catch{}}});
   try{localStorage.removeItem(storageKey);}catch{}
   setImportedGroup(target);setResult(`${faNumber(saved.imported+totals.imported)} ردیف نام‌دار پردازش شد؛ ${faNumber(saved.invalid+totals.invalid)} ردیف کنار گذاشته شد.`);setPrepared(null);groups.reload();await refresh();await onImported?.(target);notify('شماره‌ها با نام وارد شدند؛ پیامی ارسال نشد.');
  }catch(err){setError(`${(err as Error).message} پیشرفت ذخیره شده است؛ همین فایل و گروه را دوباره انتخاب کنید تا ادامه پیدا کند.`);notify('ورود کامل نشد؛ ادامهٔ ورود از همین فایل امکان‌پذیر است.');}finally{setBusy(false);}
 }
 return <section className="sms-import-box" aria-label="افزودن مخاطبان از فایل CSV"><h3>افزودن شماره‌ها با نام از فایل CSV</h3>
 <p>نام فروشگاه، نام و نام خانوادگی فارسی و ستون‌های Phone و Name شناخته می‌شوند. شماره‌های تکراری و ردیف‌های بدون نام وارد نمی‌شوند.</p>
 <a className="sms-button sms-secondary" href="/sms-assets/contacts-template.csv" download="قالب-مخاطبان.csv">دریافت قالب CSV</a>
 {!groupId&&<><Field label="شماره‌ها به کدام گروه اضافه شوند؟"><select disabled={busy} value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}><option value="">ساخت گروه از همین فایل</option>{groups.resource?.groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></Field>{!selectedGroup&&<Field label="نام گروه جدید"><input disabled={busy} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="پس از انتخاب فایل، نام آن پیشنهاد می‌شود"/></Field>}</>}
 <label className="sms-file-label" htmlFor={inputId}>انتخاب فایل CSV</label><input id={inputId} aria-label="انتخاب فایل CSV" type="file" accept=".csv,text/csv" disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void choose(file);}}/>
 {prepared&&<p>{fileName}: {faNumber(prepared.rows)} شمارهٔ یکتای نام‌دار؛ {faNumber(prepared.duplicates)} تکراری، {faNumber(prepared.unnamed)} بدون نام و {faNumber(prepared.invalid)} نامعتبر کنار گذاشته شد.</p>}
 <p className="sms-muted">تا ۵۰٬۰۰۰ ردیف و ۲۰ مگابایت؛ فایل خودکار بخش‌بندی می‌شود و خطاهای موقت دوباره امتحان می‌شوند. اکسل را CSV UTF-8 ذخیره کنید. فقط مخاطبان اضافه می‌شوند؛ پیامکی ارسال نمی‌شود.</p>
 <button type="button" disabled={busy||!prepared||!fileHash||!groupId&&!selectedGroup&&!name.trim()} onClick={()=>void start()}>{busy?'در حال افزودن شماره‌ها…':'افزودن شماره‌های فایل'}</button>
 {busy&&prepared&&<p role="status">{faNumber(progress)} از {faNumber(prepared.rows)} شماره پردازش شد.</p>}
 {error&&<p role="alert">{error}</p>}{result&&<p role="status">{result}</p>}
 {importedGroup&&<Link className="sms-button sms-secondary" href={'/sms/campaigns?new=1&groupId='+encodeURIComponent(importedGroup)}>ساخت کمپین با همین شماره‌ها</Link>}
 </section>;
}
