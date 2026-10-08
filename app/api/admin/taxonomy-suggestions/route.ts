import { ensureSearchInterestSchema } from "@/lib/server/search-interest";
import { guides } from "@/lib/guides";
import { normalizeTopic } from "@/lib/search-topics";
import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";
import { ensureTaxonomySuggestions } from "@/lib/server/taxonomy-suggestions";
import { normalizeTaxonomySuggestion } from "@/lib/taxonomy-suggestions";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ok:false,error:"UNAUTHORIZED"},{status:401});
  const db = (env as any).DB;
  await ensureTaxonomySuggestions(db);
  const result = await db.prepare("SELECT t.*, b.name AS business_name FROM taxonomy_suggestions t JOIN businesses b ON b.id=t.business_id ORDER BY CASE t.status WHEN 'pending' THEN 0 ELSE 1 END, t.id DESC LIMIT 200").all();
  await ensureSearchInterestSchema(db);
  const interest=await db.prepare("SELECT topic,SUM(searches) AS searches,SUM(no_results) AS noResults FROM marketplace_search_interest_daily WHERE event_date>=date('now','-29 days') GROUP BY topic ORDER BY searches DESC LIMIT 20").all();
  const searchInterest=(interest.results||[]).map((row:any)=>({...row,guideSlugs:guides.filter(guide=>guide.keywords.some(word=>normalizeTopic(word)===normalizeTopic(row.topic))).slice(0,3).map(guide=>guide.slug)}));
  return Response.json({ok:true,suggestions:result.results || [],searchInterest},{headers:{"Cache-Control":"no-store"}});
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ok:false,error:"UNAUTHORIZED"},{status:401});
  const body = await request.json().catch(()=>({}));
  const name = normalizeTaxonomySuggestion(body.normalizedName);
  if (!Number.isSafeInteger(body.id) || body.id<1 || !["reviewed","rejected"].includes(body.status) || (body.status==="reviewed" && name.length<2)) return Response.json({ok:false,error:"INVALID_INPUT"},{status:400});
  const db = (env as any).DB;
  await ensureTaxonomySuggestions(db);
  const result = await db.prepare("UPDATE taxonomy_suggestions SET status=?, normalized_name=?, updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING id").bind(body.status,name||null,body.id).first();
  return Response.json({ok:Boolean(result)}, {status:result?200:404});
}
