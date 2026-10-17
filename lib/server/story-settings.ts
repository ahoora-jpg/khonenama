import { STORY_TEMPLATES, type StoryTemplate } from "@/lib/story-templates";
export async function ensureStorySettings(db:any){await db.prepare("CREATE TABLE IF NOT EXISTS story_template_settings (id INTEGER PRIMARY KEY,settings_json TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();}
export async function storySettings(db:any):Promise<StoryTemplate[]>{
  await ensureStorySettings(db);
  const rows=await db.prepare("SELECT id,settings_json FROM story_template_settings").all();
  return STORY_TEMPLATES.map(base=>{const row=(rows.results||[]).find((r:any)=>r.id===base.id);if(!row)return {...base,enabled:true};try{return {...base,...JSON.parse(row.settings_json),id:base.id,layout:base.layout};}catch{return {...base,enabled:true};}});
}
export function validateStorySetting(body:any){
  if(!body||!Number.isInteger(body.id)||!STORY_TEMPLATES.some(t=>t.id===body.id)||typeof body.enabled!=="boolean"||!["pro","premium"].includes(body.minimumPlan))return null;
  if(["background","ink","accent"].some(k=>typeof body[k]!=="string"||!/^#[a-fA-F0-9]{6}$/.test(body[k])))return null;
  if(["showPhone","showCity","showCategory"].some(k=>typeof body[k]!=="boolean"))return null;
  if(body.backgroundAsset&&!(typeof body.backgroundAsset==="string"&&/^\/images\/story-backgrounds\/[a-zA-Z0-9_-]+\.(webp|png|jpg)$/.test(body.backgroundAsset)))return null;
  return {id:body.id,enabled:body.enabled,minimumPlan:body.minimumPlan,background:body.background,ink:body.ink,accent:body.accent,showPhone:body.showPhone,showCity:body.showCity,showCategory:body.showCategory,backgroundAsset:body.backgroundAsset||""};
}
export async function ensureStoryErrors(db:any){await db.prepare("CREATE TABLE IF NOT EXISTS story_generation_errors (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,template_id INTEGER NOT NULL,error_code TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();}
