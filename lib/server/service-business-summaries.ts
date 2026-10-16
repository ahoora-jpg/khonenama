import { env } from 'cloudflare:workers';
export type ServiceBusinessSummary={id:number;slug:string;name:string;description:string;city:string;area:string};
// Service result cards do not need galleries, albums, reviews or subscription hydration.
export async function listServiceBusinessSummaries(serviceName:string,limit=50):Promise<ServiceBusinessSummary[]>{
 const db=(env as any).DB;if(!db)return [];
 const rows=await db.prepare(`SELECT b.id,b.slug,b.name,b.description,b.city,b.area FROM businesses b
 WHERE b.status='published' AND b.slug<>'alayy-dkvr-krj' AND b.slug NOT GLOB 'ghrfh-azmayshy-tbdyl-[0-9]*-thran'
 AND NOT EXISTS(SELECT 1 FROM business_visibility_controls v WHERE v.business_id=b.id AND v.owner_paused=1)
 AND length(trim(COALESCE(b.name,'')))>=2 AND length(trim(COALESCE(b.description,'')))>=20 AND length(trim(COALESCE(b.city,'')))>=2
 AND EXISTS(SELECT 1 FROM business_service_areas a WHERE a.business_id=b.id)
 AND EXISTS(SELECT 1 FROM business_categories c WHERE c.business_id=b.id)
 AND EXISTS(SELECT 1 FROM business_services bs JOIN services s ON s.id=bs.service_id WHERE bs.business_id=b.id AND s.name=?)
 ORDER BY (SELECT (COALESCE(SUM(r.rating),0)+15.0)/(COUNT(*)+5.0) FROM reviews r WHERE r.business_id=b.id AND r.status='published') DESC,b.id DESC LIMIT ?`).bind(serviceName,Math.max(1,Math.min(Math.floor(limit)||50,100))).all();
 return rows.results||[];
}
