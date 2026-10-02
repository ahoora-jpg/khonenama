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
await request('/api/me/business/visibility',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ownerPaused:false})});
const currentMedia=await request('/api/me/business/media');
if(!(currentMedia.body?.media?.length)){const imagePath=process.env.TEST_BUSINESS_IMAGE||'public/images/editorial/photo-1780817612741-f8f3785d9908.webp';const data=new FormData();data.set('file',new File([readFileSync(imagePath)],'khonenama-test-cover.webp',{type:'image/webp'}));await request('/api/me/business/media/upload',{method:'POST',body:data});}
const verifiedMedia=await request('/api/me/business/media');
for(const media of verifiedMedia.body?.media||[]){const response=await fetch(media.file_url,{signal:AbortSignal.timeout(90000)});const bytes=await response.arrayBuffer();report.push({check:'stored-image',status:response.status,type:response.headers.get('content-type'),bytes:bytes.byteLength});}
await request('/api/me/business/public-link',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:business.slug})});
const qr=await request('/api/me/business/qr');
mkdirSync('outputs',{recursive:true});if(qr.response.ok)writeFileSync('outputs/test-business-qr.svg',qr.text);
await request('/business/'+encodeURIComponent(business.slug));
await request('/g/'+business.id);
const search=await request('/api/v1/businesses?q='+encodeURIComponent('غرفه آزمایشی')+'&location='+encodeURIComponent('تهران'));
report.push({check:'search-matches-test-business',matched:search.text.includes(business.slug)});
await request('/api/me/business/albums');
const paused=await request('/api/me/business/visibility',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ownerPaused:true})});
await request('/api/auth/logout',{method:'POST'});
await request('/api/auth/business/login',json({phone,password}));
await request('/api/me/business');
writeFileSync('outputs/live-business-flow.json',JSON.stringify({business:{id:business.id,name:business.name,slug:business.slug},newlyCreated,kept:true,paused:paused.body?.ownerPaused,checks:report},null,2));
