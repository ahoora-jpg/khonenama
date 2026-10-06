import { env } from "cloudflare:workers";
import { serviceCatalog, servicePath, MIN_SERVICE_BUSINESSES } from "@/lib/service-catalog";
export async function listServiceSitemapEntries() {
 try {const db=(env as any).DB; if(!db) return [];
 await db.prepare("CREATE TABLE IF NOT EXISTS business_visibility_controls (business_id INTEGER PRIMARY KEY, owner_paused INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
 const result=await db.prepare("SELECT c.slug AS category, s.name AS service, COUNT(DISTINCT b.id) AS total FROM businesses b JOIN business_categories bc ON bc.business_id=b.id JOIN categories c ON c.id=bc.category_id JOIN business_services bs ON bs.business_id=b.id JOIN services s ON s.id=bs.service_id WHERE b.status='published' AND b.slug <> 'alayy-dkvr-krj' AND length(trim(COALESCE(b.name,''))) >= 2 AND length(trim(COALESCE(b.description,''))) >= 20 AND length(trim(COALESCE(b.city,''))) >= 2 AND EXISTS (SELECT 1 FROM business_service_areas sa WHERE sa.business_id=b.id) AND NOT EXISTS (SELECT 1 FROM business_visibility_controls v WHERE v.business_id=b.id AND v.owner_paused=1) GROUP BY c.slug,s.name HAVING COUNT(DISTINCT b.id) >= ?").bind(MIN_SERVICE_BUSINESSES).all();
 return (result.results || []).flatMap((row: any)=>{const item=serviceCatalog.find(x=>x.category===row.category&&x.name===row.service);return item?[{url:"https://khonenama.ir"+servicePath(item),changeFrequency:"weekly" as const,priority:0.7}]:[];});
 } catch(error) {console.warn("service sitemap lookup failed",error);return [];}
}
