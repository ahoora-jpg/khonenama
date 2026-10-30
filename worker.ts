import {routeSmsIsolation,smsPanel,smsIsolated} from './lib/server/sms/isolation';
import {drainSiteProjection,applySiteProjection} from './lib/server/sms/site-projection';
import {consumeSmsEvents,drainAccessEvents,drainSmsOutbox} from "./lib/server/sms/event-consumer";
import {applyAcquisitionEvent} from "./lib/server/sms/acquisition-events";
import {handleBridge} from "./lib/server/sms/bridge";
import {smsLog,smsFailure,SmsEventError} from "./lib/server/sms/events";
import { drainProfileReminders } from "./lib/server/profile-reminders";
import app from "vinext/server/app-router-entry";
import { drainBusinessPush } from "./lib/server/business-push";
import { drainBusinessWebPush } from "./lib/server/business-web-push";
import { cleanExpiredMedia } from "./lib/server/media-retention";
import { reconcileSms } from "./lib/server/sms/reconcile";
import { routeSmsHost } from "./lib/server/sms/host";
import { ensureSmsSchema } from "./lib/server/sms/schema";
import { liveSmsEnabled } from "./lib/server/sms/config";
import { handleWorkerBridge } from "./lib/server/sms/worker-bridge";
import { handleAcquisitionLink,recordAcquisitionStage,reconcileAcquisition } from './lib/server/sms/acquisition';
export default {
 async fetch(request:Request, env:any, ctx:any){
  const isolated=await routeSmsIsolation(request,env);if(isolated)return isolated;
  const routed=routeSmsHost(request);
  const url=new URL(request.url);
  if(url.hostname==='www.khonenama.ir'&&url.pathname.startsWith('/s/')){url.hostname='khonenama.ir';url.protocol='https:';return Response.redirect(url.href,308);}
  if((url.hostname==='khonenama.ir'||smsPanel(env)) && url.pathname.startsWith('/s/')) {if(url.protocol!=='https:'){url.protocol='https:';return Response.redirect(url.href,308);}return handleAcquisitionLink(request,env.DB,{queue:env.SMS_EVENTS});}
  if(url.hostname==='khonenama.ir' && url.pathname==='/register-business' && request.method==='GET'){
    if(env.SMS_EVENTS){try{await recordAcquisitionStage(env.DB,request,'registration_view',{queue:env.SMS_EVENTS});}catch{return Response.json({ok:false,error:'EVENT_NOT_ACCEPTED'},{status:503,headers:{'Retry-After':'15','Cache-Control':'no-store'}});}}
    else ctx.waitUntil(recordAcquisitionStage(env.DB,request,'registration_view').catch(()=>{}));
  }
  if (!(routed instanceof Response) && url.pathname==='/api/v1/sms/bridge') return handleWorkerBridge(request,env.DB,{queue:env.SMS_EVENTS,rateLimiter:env.SMS_BRIDGE_RATE_LIMITER,migrating:env.SMS_MIGRATING==='true'});
  if (!(routed instanceof Response) && (url.hostname==='sms.khonenama.ir' || url.pathname.startsWith('/api/admin/sms') || url.pathname==='/admin/sms')) {
   try { await ensureSmsSchema(env.DB); }
   catch { return new Response('مرکز پیامک موقتاً در دسترس نیست.',{status:503,headers:{'Cache-Control':'no-store'}}); }
  }
  const result=routed instanceof Response?routed:await app.fetch(routed,env,ctx);
  if(smsPanel(env)){const response=new Response(result.body,result);response.headers.set('X-Khonenama-Runtime','sms');return response;}
  return result;
 },
 async queue(batch:any,env:any){
  if(!smsPanel(env)&&(smsIsolated(env)||env.SMS_MIGRATING==='true')){for(const message of batch.messages)message.retry({delaySeconds:120});return;}
  await consumeSmsEvents(batch,env,async(event,applied,lease)=>{
    if(event.type==='site_sync')return applySiteProjection(env.DB,event,applied);
    if(event.type==='bridge_report'||event.type==='bridge_inbound'){
      const response=await handleBridge(new Request('https://khonenama.ir/api/v1/sms/bridge',{method:'POST',headers:{authorization:'Bearer '+env.SMS_BRIDGE_TOKEN,'content-type':'application/json'},body:JSON.stringify(event.payload)}));
      if(!response.ok)throw new SmsEventError('BRIDGE_EVENT_HTTP_'+response.status,response.status>=500||response.status===429);
      return;
    }
    return applyAcquisitionEvent(env.DB,event,applied,lease);
  });
 },
 scheduled(_event:unknown, env:any, ctx:{waitUntil:(promise:Promise<unknown>)=>void}){
  ctx.waitUntil(ensureSmsSchema(env.DB).then(()=>Promise.all([drainSmsOutbox(env.DB,env.SMS_EVENTS),drainAccessEvents(env.DB,env.SMS_EVENTS)])).catch(error=>smsLog('outbox_deferred',{requestId:'scheduled',reason:smsFailure(error).code})));
  if(!smsPanel(env)){
  if(smsIsolated(env))ctx.waitUntil(drainSiteProjection(env.DB,env.SMS_EVENTS).catch(error=>smsLog('site_projection_pending',{requestId:'scheduled',reason:smsFailure(error).code})));
  ctx.waitUntil(drainBusinessPush(env.DB));
  ctx.waitUntil(drainBusinessWebPush(env.DB));
  ctx.waitUntil(cleanExpiredMedia(env.DB));
  ctx.waitUntil(drainProfileReminders(env.DB, env).catch(()=>console.warn("PROFILE_REMINDER_JOB_FAILED")));
  }
  if(smsPanel(env)||(!smsIsolated(env)&&env.SMS_MIGRATING!=='true')){
  ctx.waitUntil(ensureSmsSchema(env.DB).then(()=>reconcileSms(env.DB,{liveSendingEnabled:liveSmsEnabled(env)})).catch(()=>console.warn("SMS_RECONCILE_JOB_FAILED")));
  ctx.waitUntil(ensureSmsSchema(env.DB).then(()=>reconcileAcquisition(env.DB)).catch(()=>console.warn('SMS_ACQUISITION_JOB_FAILED')));
  }
 },
};
