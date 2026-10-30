import {eventHash,makeSmsEvent,persistSmsEvent,smsRequestId,smsLog,smsFailure,type SmsEventQueue} from './events';
const sessionOf=(request:Request)=>(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>/^kn_sms_visit=[a-f0-9]{40}$/.test(s))?.slice(13)||'';
export async function queueAcquisitionLink(request:Request,db:any,queue:SmsEventQueue){
  const headers=new Headers({'Location':'https://khonenama.ir/register-business','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'});
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...Object.fromEntries(headers),Allow:'GET, HEAD'}});
  const token=new URL(request.url).pathname.slice(3);
  if(!/^[a-f0-9]{40}$/.test(token))return new Response('این لینک معتبر نیست.',{status:404,headers});
  let validatedAtAccept=false;
  try{
    const link=await db.prepare("SELECT l.*,s.tracking_enabled FROM sms_recipient_links l JOIN sms_acquisition_settings s ON s.tenant_id=l.tenant_id WHERE l.token=? AND l.tenant_id='khonenama'").bind(token).first();
    if(!link||!link.active||(link.expires_at&&Date.parse(link.expires_at)<=Date.now()))return new Response('این لینک غیرفعال یا منقضی شده است. برای ساخت غرفه به خونه‌نما مراجعه کنید.',{status:410,headers});
    if(['/register-business','/for-business'].includes(link.destination))headers.set('Location','https://khonenama.ir'+link.destination);
    if(!link.tracking_enabled||request.method==='HEAD')return new Response(null,{status:302,headers});
    validatedAtAccept=true;
  }catch(error){smsLog('link_lookup_deferred',{requestId:smsRequestId(request),eventType:'click',reason:smsFailure(error).code});}
  if(request.method==='HEAD')return new Response(null,{status:302,headers});
  const suspicious=/bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|headless/i.test(request.headers.get('user-agent')||'')||request.headers.get('purpose')==='prefetch'||request.headers.get('sec-purpose')?.includes('prefetch')===true;
  const requestId=smsRequestId(request),supplied=request.headers.get('idempotency-key');
  if(supplied&&!/^[a-zA-Z0-9:_-]{1,100}$/.test(supplied))return new Response(null,{status:400,headers});
  const session=sessionOf(request)||(await eventHash({seed:supplied||requestId,token})).slice(0,40);
  const event=await makeSmsEvent('click',{token,session,suspicious,validatedAtAccept},requestId,(supplied||requestId)+':'+token);
  try{await persistSmsEvent(db,queue,event);}catch(error){headers.delete('Location');headers.set('Retry-After','15');smsLog('not_accepted',{requestId,eventType:'click',eventId:event.id,reason:smsFailure(error).code});return Response.json({ok:false,error:'EVENT_NOT_ACCEPTED',requestId},{status:smsFailure(error).transient?503:409,headers});}
  if(!suspicious)headers.append('Set-Cookie',`kn_sms_visit=${session}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
  headers.set('X-SMS-Event-Id',event.id);return new Response(null,{status:302,headers});
}
