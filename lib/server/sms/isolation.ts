import {crossSiteMutation} from '../../request-security';
import {createAdminCookie} from '../admin-session';
import {isSmsAdminRequest} from './admin-auth';
export function smsIsolated(env:any){return env.SMS_ROLE==='site'||env.SMS_ISOLATED==='true';}
export function smsPanel(env:any){return env.SMS_ROLE==='panel';}
const privateHeaders={'Cache-Control':'private, no-store'};
/** Service bindings isolate compute; panel never receives the site's D1 binding. */
export async function routeSmsIsolation(request:Request,env:any):Promise<Response|null>{
 const url=new URL(request.url),path=url.pathname;
 if(env.SMS_MIGRATING==='true'&&path.startsWith('/api/admin/sms')&&!['GET','HEAD','OPTIONS'].includes(request.method))return Response.json({ok:false,error:'SMS_MIGRATION_RETRY'},{status:429,headers:{...privateHeaders,'Retry-After':'30'}});
 if(smsPanel(env)){
  const canonical=['sms.khonenama.ir','www.sms.khonenama.ir'].includes(url.hostname);
  if(!canonical&&!path.startsWith('/s/')&&!path.startsWith('/api/admin/sms')&&path!=='/api/v1/sms/bridge')return new Response('یافت نشد',{status:404,headers:privateHeaders});
  if(path==='/api/admin/login'){
   if(request.method!=='POST')return new Response(null,{status:405});
   if(crossSiteMutation(request))return Response.json({ok:false},{status:403,headers:privateHeaders});
   if(!env.AUTH_SERVICE)return Response.json({ok:false,error:'AUTH_UNAVAILABLE'},{status:503,headers:privateHeaders});
   if(Number(request.headers.get('content-length')||0)>8192)return new Response(null,{status:413});
   const reader=request.body?.getReader(),parts:Uint8Array[]=[];let size=0;
   try{if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>8192){await reader.cancel();return new Response(null,{status:413});}parts.push(part.value);}}catch{return new Response(null,{status:400});}
   const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}const raw=new TextDecoder().decode(bytes);
   const headers=new Headers({'content-type':'application/json',origin:'https://khonenama.ir','sec-fetch-site':'same-origin'});
   if(request.headers.has('cf-connecting-ip'))headers.set('cf-connecting-ip',request.headers.get('cf-connecting-ip')!);
   try{
    const response=await env.AUTH_SERVICE.fetch(new Request('https://khonenama.ir/api/admin/login',{method:'POST',headers,body:raw,signal:AbortSignal.timeout(15000)}));
    if(!response.ok)return new Response(response.body,{status:response.status,headers:{...privateHeaders,'content-type':'application/json',...(response.headers.has('retry-after')?{'retry-after':response.headers.get('retry-after')!}:{})}});
    return Response.json({ok:true},{headers:{...privateHeaders,'Set-Cookie':await createAdminCookie()}});
   }catch{return Response.json({ok:false,error:'AUTH_UNAVAILABLE'},{status:503,headers:privateHeaders});}
  }
  return null;
 }
 if(!smsIsolated(env)){
  if(env.SMS_MIGRATING==='true'&&path.startsWith('/api/admin/sms')&&!['GET','HEAD','OPTIONS'].includes(request.method))return Response.json({ok:false,error:'SMS_MIGRATION_RETRY'},{status:429,headers:{...privateHeaders,'Retry-After':'30'}});
  return null;
 }
 if(['/sms','/admin/sms'].includes(path)||path.startsWith('/sms/')){url.hostname='sms.khonenama.ir';url.pathname=path==='/sms'||path==='/admin/sms'?'/':path.slice(4);return Response.redirect(url.href,308);}
 if(['sms.khonenama.ir','www.sms.khonenama.ir'].includes(url.hostname)||path.startsWith('/s/')||path.startsWith('/api/admin/sms')||path==='/api/v1/sms/bridge'){
  if(!env.SMS_SERVICE)return Response.json({ok:false,error:'SMS_SERVICE_UNAVAILABLE'},{status:503,headers:privateHeaders});
  const headers=new Headers(request.headers);headers.delete('x-sms-internal-admin');
  if(path.startsWith('/api/admin/sms')&&env.SMS_INTERNAL_TOKEN&&!crossSiteMutation(request)&&await isSmsAdminRequest(request))headers.set('x-sms-internal-admin',env.SMS_INTERNAL_TOKEN);
  return env.SMS_SERVICE.fetch(new Request(request,{headers}));
 }
 return null;
}
