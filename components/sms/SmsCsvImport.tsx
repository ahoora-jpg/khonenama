"use client";
import {useId,useState} from 'react';
import Link from 'next/link';
import {csvImportBatches,importCsvBatches} from '@/lib/sms-csv';
import {faNumber} from '@/lib/sms-admin-ui';
import {Field,smsApi,useSms,useSmsResource} from './SmsAdminShell';
export function SmsCsvImport({groupId,onImported}:{groupId?:string;onImported?:(id:string)=>void|Promise<void>}){
 const {notify,refresh}=useSms(),inputId=useId();
 const [selectedGroup,setSelectedGroup]=useState(''),[name,setName]=useState(''),[fileName,setFileName]=useState(''),[prepared,setPrepared]=useState<ReturnType<typeof csvImportBatches>|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState(''),[result,setResult]=useState(''),[importedGroup,setImportedGroup]=useState('');
 const groups=useSmsResource<{groups:{id:string;name:string}[]}>('/api/admin/sms/workspace?view=groups');
 return <section className="sms-import-box" aria-label="افزودن مخاطبان از فایل CSV"><h3>افزودن شماره‌ها از فایل CSV</h3>
 <p>فایل اکسل را با گزینهٔ CSV UTF-8 ذخیره کنید. ستون اول <bdi>phone</bdi> و ستون اختیاری نام <bdi>name</bdi> است. شماره‌های تکراری دوباره ساخته نمی‌شوند.</p>
 <a className="sms-button sms-secondary" href="/sms-assets/contacts-template.csv" download="قالب-مخاطبان.csv">دریافت قالب CSV</a>
 {!groupId&&<><Field label="شماره‌ها به کدام گروه اضافه شوند؟"><select disabled={busy} value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}><option value="">ساخت گروه از همین فایل</option>{groups.resource?.groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></Field>{!selectedGroup&&<Field label="نام گروه جدید"><input disabled={busy} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="پس از انتخاب فایل، نام آن پیشنهاد می‌شود"/></Field>}</>}
 <label className="sms-file-label" htmlFor={inputId}>انتخاب فایل CSV</label><input id={inputId} aria-label="انتخاب فایل CSV" type="file" accept=".csv,text/csv" disabled={busy} onChange={async e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';setPrepared(null);setResult('');setError('');setImportedGroup('');setProgress(0);if(!file)return;try{if(!/\.csv$/i.test(file.name))throw Error('لطفاً فایل CSV انتخاب کنید؛ فایل مستقیم اکسل پذیرفته نمی‌شود.');if(file.size>1_000_000)throw Error('حجم فایل باید کمتر از یک مگابایت باشد.');const parsed=csvImportBatches(await file.text());setPrepared(parsed);setFileName(file.name);if(!name)setName(file.name.replace(/\.csv$/i,'').slice(0,100));}catch(err){setError((err as Error).message);}}}/>
 {prepared&&<p>{fileName} — {faNumber(prepared.rows)} ردیف آمادهٔ بررسی و ورود</p>}
 <p className="sms-muted">حداکثر ۵۰۰۰ ردیف در هر فایل؛ فایل‌های بزرگ خودکار بخش‌بندی می‌شوند. فقط مخاطبان اضافه می‌شوند؛ پیامکی ارسال نمی‌شود.</p>
 <button type="button" disabled={busy||!prepared||!groupId&&!selectedGroup&&!name.trim()} onClick={async()=>{if(!prepared)return;setBusy(true);setError('');setResult('');setProgress(0);let target=groupId||selectedGroup;try{if(!target){const created=await smsApi('/api/admin/sms/campaigns',{action:'group',name:name.trim()});target=created.id;setSelectedGroup(target);}const totals=await importCsvBatches(prepared.batches,target,p=>smsApi('/api/admin/sms/campaigns',p),setProgress);setImportedGroup(target);setResult(`${faNumber(totals.imported)} ردیف معتبر پردازش شد؛ ${faNumber(totals.invalid)} ردیف نامعتبر یا حذف‌شده کنار گذاشته شد.`);setPrepared(null);groups.reload();await refresh();await onImported?.(target);notify('ورود فایل انجام شد؛ پیامی ارسال نشد.');}catch(err){setError(`${(err as Error).message} اگر بخشی از شماره‌ها وارد شده، انتخاب و ورود دوبارهٔ فایل شمارهٔ تکراری ایجاد نمی‌کند.`);await refresh();notify('ورود فایل کامل نشد؛ می‌توانید همان فایل را دوباره وارد کنید.');if(target)await onImported?.(target);}finally{setBusy(false);}}}>{busy?'در حال افزودن شماره‌ها…':'افزودن شماره‌های فایل'}</button>
 {busy&&prepared&&<p role="status">{faNumber(progress)} از {faNumber(prepared.rows)} ردیف پردازش شد.</p>}
 {error&&<p role="alert">{error}</p>}{result&&<p role="status">{result}</p>}
 {importedGroup&&<Link className="sms-button sms-secondary" href={'/sms/campaigns?new=1&groupId='+encodeURIComponent(importedGroup)}>ساخت کمپین با همین شماره‌ها</Link>}
 </section>;
}
