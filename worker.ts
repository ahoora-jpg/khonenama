import { drainProfileReminders } from "./lib/server/profile-reminders";
import app from "vinext/server/app-router-entry";
import { drainBusinessPush } from "./lib/server/business-push";
import { drainBusinessWebPush } from "./lib/server/business-web-push";
import { cleanExpiredMedia } from "./lib/server/media-retention";
import { reconcileSms } from "./lib/server/sms/reconcile";
import { routeSmsHost } from "./lib/server/sms/host";
export default {
 fetch(request:Request, env:any, ctx:any){
  const routed=routeSmsHost(request);
  return routed instanceof Response ? routed : app.fetch(routed,env,ctx);
 },
 scheduled(_event:unknown, env:any, ctx:{waitUntil:(promise:Promise<unknown>)=>void}){
  ctx.waitUntil(drainBusinessPush(env.DB));
  ctx.waitUntil(drainBusinessWebPush(env.DB));
  ctx.waitUntil(cleanExpiredMedia(env.DB));
  ctx.waitUntil(drainProfileReminders(env.DB, env).catch(()=>console.warn("PROFILE_REMINDER_JOB_FAILED")));
  ctx.waitUntil(reconcileSms(env.DB).catch(()=>console.warn("SMS_RECONCILE_JOB_FAILED")));
 },
};
