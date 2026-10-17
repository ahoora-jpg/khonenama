import {env} from "cloudflare:workers";
import {isAdminRequest} from "@/lib/server/admin-session";
import {ensureStorySettings,storySettings,validateStorySetting,ensureStoryErrors} from "@/lib/server/story-settings";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){if(!await isAdminRequest(request))return Response.json({ok:false},{status:401,headers});const db=(env as any).DB;await ensureStoryErrors(db);const errors=await db.prepare("SELECT id,business_id,template_id,error_code,created_at FROM story_generation_errors ORDER BY id DESC LIMIT 30").all();return Response.json({ok:true,templates:await storySettings(db),errors:errors.results||[],aiEnabled:false},{headers});}
export async function PATCH(request:Request){
  if(!await isAdminRequest(request))return Response.json({ok:false},{status:401,headers});
  const setting=validateStorySetting(await request.json().catch(()=>null));
  if(!setting)return Response.json({ok:false,error:"INVALID_TEMPLATE_SETTINGS"},{status:400,headers});
  const db=(env as any).DB;await ensureStorySettings(db);
  await db.prepare("INSERT INTO story_template_settings(id,settings_json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET settings_json=excluded.settings_json,updated_at=CURRENT_TIMESTAMP").bind(setting.id,JSON.stringify(setting)).run();
  return Response.json({ok:true},{headers});
}
