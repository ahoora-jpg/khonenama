import {env} from "cloudflare:workers";
import {canonicalSearchTopic} from "@/lib/search-topics";
import {ensureSearchInterestSchema} from "@/lib/server/search-interest";
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));const topic=typeof body.topic==="string"?canonicalSearchTopic(body.topic):null;
 if(!topic)return Response.json({ok:false,error:"INVALID_TOPIC"},{status:400});
 const db=(env as any).DB;if(!db)return Response.json({ok:false},{status:503});
 await ensureSearchInterestSchema(db);
 await db.prepare("INSERT INTO marketplace_search_interest_daily(topic,event_date,searches,no_results) VALUES(?,date('now'),1,?) ON CONFLICT(topic,event_date) DO UPDATE SET searches=searches+1,no_results=no_results+excluded.no_results").bind(topic,body.hasResults===false?1:0).run();
 return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
