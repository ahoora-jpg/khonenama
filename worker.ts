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
export default {
 async fetch(request:Request, env:any, ctx:any){
  const routed=routeSmsHost(request);
  const url=new URL(request.url);
  if (!(routed instanceof Response) && url.pathname==='/api/v1/sms/bridge') return handleWorkerBridge(request,env.DB);
  if (!(routed instanceof Response) && (url.hostname==='sms.khonenama.ir' || url.pathname.startsWith('/api/admin/sms') || url.pathname==='/admin/sms')) {
   try { await ensureSmsSchema(env.DB); }
   catch { return new Response('مرکز پیامک موقتاً در دسترس نیست.',{status:503,headers:{'Cache-Control':'no-store'}}); }
  }
  return routed instanceof Response ? routed : app.fetch(routed,env,ctx);
 },
 scheduled(_event:unknown, env:any, ctx:{waitUntil:(promise:Promise<unknown>)=>void}){
  ctx.waitUntil(drainBusinessPush(env.DB));
  ctx.waitUntil(drainBusinessWebPush(env.DB));
  ctx.waitUntil(cleanExpiredMedia(env.DB));
  ctx.waitUntil(drainProfileReminders(env.DB, env).catch(()=>console.warn("PROFILE_REMINDER_JOB_FAILED")));
  ctx.waitUntil(ensureSmsSchema(env.DB).then(()=>reconcileSms(env.DB,{liveSendingEnabled:liveSmsEnabled(env)})).catch(()=>console.warn("SMS_RECONCILE_JOB_FAILED")));
 },
};
