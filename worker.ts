import app from "vinext/server/app-router-entry";
import { drainBusinessPush } from "./lib/server/business-push";
export default {
 fetch: app.fetch,
 scheduled(_event:unknown, env:any, ctx:{waitUntil:(promise:Promise<unknown>)=>void}){
  ctx.waitUntil(drainBusinessPush(env.DB));
 },
};
