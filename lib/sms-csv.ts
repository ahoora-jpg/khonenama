export type CsvContact={phone:string;name:string;city:string;area:string;trade:string};
export function csvImportBatches(content:string):{rows:number;batches:string[];records:CsvContact[];duplicates:number;unnamed:number;invalid:number}{
 if(new TextEncoder().encode(content).length>20_000_000)throw Error('حجم فایل باید کمتر از ۲۰ مگابایت باشد.');
 const firstLine=content.split(/\r?\n/,1)[0],delimiter=firstLine.includes(';')&&!firstLine.includes(',')?';':',';
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
 for(let i=0;i<content.length;i++){
  const c=content[i];
  if(c==='"'){if(quoted&&content[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===delimiter&&!quoted){row.push(field);field='';}
  else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&content[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}
  else field+=c;
 }
 if(quoted)throw Error('فایل CSV ناقص است؛ علامت نقل‌قول بسته نشده است.');
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 const key=(v:string)=>v.trim().toLowerCase().replace(/[\s\u200c\u200e\u200f_-]/g,'');
 const header=rows.shift()?.map(key);
 if(!header||!header.some(h=>['phone','mobile','شماره','شمارهتلفن','تلفنهمراه','موبایل'].includes(h)))throw Error('نام ستون اول باید phone باشد؛ قالب نمونه را دریافت کنید.');
 if(header.length>20||header.some(v=>v.length>120))throw Error('ستون‌های فایل بیش از حد زیاد یا طولانی هستند.');
 if(!rows.length)throw Error('فایل شماره‌ای برای افزودن ندارد.');
 if(rows.length>50000)throw Error('هر فایل می‌تواند حداکثر ۵۰٬۰۰۰ ردیف داشته باشد.');
 const encode=(r:string[])=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',');
 const value=(row:string[],keys:string[])=>keys.map(k=>row[header.indexOf(key(k))]?.trim()||'').find(Boolean)||'';
 const records:CsvContact[]=[],seen=new Map<string,CsvContact>();let duplicates=0,unnamed=0,invalid=0;
 for(const r of rows){
  const raw=value(r,['phone','mobile','شماره','شماره تلفن','تلفن همراه','موبایل']);
  const phone=normalizeCsvPhone(raw);if(!phone){invalid++;continue;}
  const shop=value(r,['نام فروشگاه','نام کسب و کار','فروشگاه']);
  const person=value(r,['نام و نام خانوادگی','نام کامل'])||[value(r,['نام']),value(r,['نام خانوادگی'])].filter(Boolean).join(' ');
  const name=(value(r,['name','display_name'])||[shop,person].filter(Boolean).join(' — ')).slice(0,120);
  const contact={phone,name,city:value(r,['city','شهرستان','شهر']).slice(0,100),area:value(r,['area','منطقه']).slice(0,100),trade:value(r,['trade','صنف'])};
  if(!name.replace(/[\s\u200c\u200e\u200f-]/g,'')){unnamed++;continue;}
  const prior=seen.get(phone);if(prior){duplicates++;if(contact.name.length>prior.name.length)Object.assign(prior,contact);continue;}
  seen.set(phone,contact);records.push(contact);
 }
 if(!records.length)throw Error('هیچ شماره معتبرِ دارای نام در فایل پیدا نشد.');
 const outputHeader=['phone','name','city','area','trade'];
 const heading=encode(outputHeader),batches:string[]=[];let current:string[]=[],bytes=0;
 // Small requests keep the existing D1 importer below its per-request query budget.
 for(const record of records){const line=encode(outputHeader.map(key=>record[key as keyof CsvContact])),size=new TextEncoder().encode(JSON.stringify(line)).length;
  if(size>45000)throw Error('یکی از ردیف‌ها بیش از حد طولانی است؛ اطلاعات اضافی آن را حذف کنید.');
  if(current.length&&(current.length===100||bytes+size>45000)){batches.push(heading+'\r\n'+current.join('\r\n'));current=[];bytes=0;}
  current.push(line);bytes+=size;
 }
 if(current.length)batches.push(heading+'\r\n'+current.join('\r\n'));
 return {rows:records.length,batches,records,duplicates,unnamed,invalid};
}
export async function importCsvBatches(batches:string[],groupId:string,submit:(payload:Record<string,unknown>)=>Promise<{imported:number;invalid:number}>,onProgress:(processed:number)=>void,options:{startAt?:number;onCheckpoint?:(next:number,imported:number,invalid:number)=>void;delay?:(ms:number)=>Promise<void>}={}){
 let imported=0,invalid=0;
 for(let index=options.startAt||0;index<batches.length;index++){
 let result:{imported:number;invalid:number}|undefined;
 for(let attempt=0;attempt<4;attempt++){try{result=await submit({action:'importCsv',groupId,csv:batches[index],requireName:true});break;}catch(error){const status=Number((error as {status?:number}).status||0);if(attempt===3||status&&![408,429,500,502,503,504].includes(status))throw error;await (options.delay||((ms:number)=>new Promise<void>(r=>setTimeout(r,ms))))(Math.min(8000,500*2**attempt));}}
 if(!result)throw Error('ورود این بخش کامل نشد.');imported+=Number(result.imported)||0;invalid+=Number(result.invalid)||0;onProgress(imported+invalid);options.onCheckpoint?.(index+1,imported,invalid);
 }
 return {imported,invalid};
}

export function normalizeCsvPhone(value:string){const digits=value.trim().replace(/^'/,'').replace(/[\s()-]/g,'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));const phone=digits.replace(/^0098/,'+98').replace(/^98/,'+98').replace(/^0(?=9\d{9}$)/,'+98');return /^\+[1-9]\d{7,14}$/.test(phone)?phone:null;}
