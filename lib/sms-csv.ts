export function csvImportBatches(content:string):{rows:number;batches:string[]}{
 if(new TextEncoder().encode(content).length>1_000_000)throw Error('حجم فایل باید کمتر از یک مگابایت باشد.');
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
 const header=rows.shift()?.map(v=>v.trim().toLowerCase());
 if(!header||header[0]!=='phone')throw Error('نام ستون اول باید phone باشد؛ قالب نمونه را دریافت کنید.');
 if(header.length>20||header.some(v=>v.length>120))throw Error('ستون‌های فایل بیش از حد زیاد یا طولانی هستند.');
 if(!rows.length)throw Error('فایل شماره‌ای برای افزودن ندارد.');
 if(rows.length>5000)throw Error('هر فایل می‌تواند حداکثر ۵۰۰۰ ردیف داشته باشد.');
 const encode=(r:string[])=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',');
 const outputHeader=['phone','name','city','area','trade'];
 const heading=encode(outputHeader),batches:string[]=[];let current:string[]=[],bytes=0;
 // Small requests keep the existing D1 importer below its per-request query budget.
 for(const r of rows){const line=encode(outputHeader.map(key=>{const index=header.indexOf(key);return index<0?'':r[index]||'';})),size=new TextEncoder().encode(JSON.stringify(line)).length;
  if(size>45000)throw Error('یکی از ردیف‌ها بیش از حد طولانی است؛ اطلاعات اضافی آن را حذف کنید.');
  if(current.length&&(current.length===8||bytes+size>45000)){batches.push(heading+'\r\n'+current.join('\r\n'));current=[];bytes=0;}
  current.push(line);bytes+=size;
 }
 if(current.length)batches.push(heading+'\r\n'+current.join('\r\n'));
 return {rows:rows.length,batches};
}
export async function importCsvBatches(batches:string[],groupId:string,submit:(payload:Record<string,unknown>)=>Promise<{imported:number;invalid:number}>,onProgress:(processed:number)=>void){
 let imported=0,invalid=0;
 for(const csv of batches){const result=await submit({action:'importCsv',groupId,csv});imported+=Number(result.imported)||0;invalid+=Number(result.invalid)||0;onProgress(imported+invalid);}
 return {imported,invalid};
}
