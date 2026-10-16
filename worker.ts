import { drainProfileReminders } from "./lib/server/profile-reminders";
import app from "vinext/server/app-router-entry";
import { drainBusinessPush } from "./lib/server/business-push";
import { drainBusinessWebPush } from "./lib/server/business-web-push";
import { cleanExpiredMedia } from "./lib/server/media-retention";
export default {
 fetch: app.fetch,
 scheduled(_event:unknown, env:any, ctx:{waitUntil:(promise:Promise<unknown>)=>void}){
  ctx.waitUntil(drainBusinessPush(env.DB));
  ctx.waitUntil(drainBusinessWebPush(env.DB));
  ctx.waitUntil(cleanExpiredMedia(env.DB));
  ctx.waitUntil(drainProfileReminders(env.DB, env).catch(()=>console.warn("PROFILE_REMINDER_JOB_FAILED")));
 },
};
