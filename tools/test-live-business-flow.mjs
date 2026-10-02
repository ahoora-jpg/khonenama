import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base='https://khonenama.ir';
const phone=process.env.TEST_BUSINESS_PHONE;
const password=process.env.TEST_BUSINESS_PASSWORD;
if(!phone||!password)throw Error('Test credentials required');
let cookie='';
const report=[];
async function request(path,options={}){const response=await fetch(base+path,{...options,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...options.headers},signal:AbortSignal.timeout(90000)});const cookies=response.headers.getSetCookie();if(cookies.length)cookie=cookies.map(value=>value.split(';')[0]).join('; ');const text=await response.text();let body;try{body=JSON.parse(text);}catch{body=null;}report.push({path,status:response.status,error:body?.error});console.log(path,response.status,body?.error||'');return {response,body,text};}
const json=body=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const login=await request('/api/auth/business/login',json({phone,password}));
let newlyCreated=false;
if(!login.body?.ok){const created=await request('/api/businesses/register',json({ownerName:'آزمون فنی خونه‌نما',phone,password,businessName:'غرفه آزمایشی خونه‌نما',businessType:'store',city:'تهران',area:'آزمایشی',address:'نشانی آزمایشی؛ محل مراجعه نیست',categories:['curtain'],services:['پرده زبرا','نصب و تعمیر پرده'],serviceAreas:['تهران'],description:'این غرفه صرفاً برای آزمون فنی ثبت کسب‌وکار و گالری تصاویر خونه‌نما ساخته شده است و خدمات واقعی ارائه نمی‌کند.',plan:'free'}));if(!created.body?.ok){mkdirSync('outputs',{recursive:true});writeFileSync('outputs/live-business-flow.json',JSON.stringify(report,null,2));process.exit(2);}newlyCreated=true;}
const profile=await request('/api/me/business');
const business=profile.body?.business;
if(!business)throw Error('Business profile unavailable');
console.log('Profile',JSON.stringify({id:business.id,name:business.name,slug:business.slug,status:business.status}));
const isTest=newlyCreated||String(business.name).includes('آزمایشی');
if(!isTest){console.log('Existing real business preserved; no media or profile mutations');process.exit(3);}
const currentMedia=await request('/api/me/business/media');
if(!(currentMedia.body?.media?.length)){const imagePath='C:/Users/Apadana/OneDrive/Desktop/ChatGPT Image Oct 1, 2026, 07_00_02 PM-1.png';const data=new FormData();data.set('file',new File([readFileSync(imagePath)],'khonenama-test-cover.png',{type:'image/png'}));data.set('kind','cover');data.set('altText','تصویر معرفی خونه‌نما برای آزمون گالری');await request('/api/me/business/media/upload',{method:'POST',body:data});}
await request('/api/me/business/media');
await request('/api/me/business/public-link');
const qr=await request('/api/me/business/qr');
mkdirSync('outputs',{recursive:true});if(qr.response.ok)writeFileSync('outputs/test-business-qr.svg',qr.text);
await request('/business/'+encodeURIComponent(business.slug));
await request('/g/'+business.id);
await request('/api/me/business/albums');
const paused=await request('/api/me/business/visibility',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ownerPaused:true})});
await request('/api/auth/logout',{method:'POST'});
await request('/api/auth/business/login',json({phone,password}));
await request('/api/me/business');
writeFileSync('outputs/live-business-flow.json',JSON.stringify({business:{id:business.id,name:business.name,slug:business.slug},newlyCreated,kept:true,paused:paused.body?.ownerPaused,checks:report},null,2));
