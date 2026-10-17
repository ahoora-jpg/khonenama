export function analyticsSource(referrer: unknown, source: unknown) {
  const utm=typeof source==="string"?source.toLowerCase().slice(0,80):"";
  if(utm==="khonenama-promotion")return "promotion";
  if(/^(instagram|telegram|whatsapp|facebook|pinterest|linkedin|tiktok)$/.test(utm))return "social";
  if(/^(google|bing|yahoo|duckduckgo)$/.test(utm))return "search";
  try{
    const url=new URL(typeof referrer==="string"?referrer:"");
    if(!["http:","https:"].includes(url.protocol))return "unknown";
    const host=url.hostname.toLowerCase();
    if(/(^|\.)(google\.(?:com|co\.uk|de|fr|ca|com\.au|co\.in|co\.jp)|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(host))return "search";
    if(/(^|\.)(instagram\.com|t\.co|facebook\.com|pinterest\.(?:com|co\.uk|de|fr|ca)|t\.me|linkedin\.com|tiktok\.com)$/.test(host))return "social";
    return host==="khonenama.ir"||host==="www.khonenama.ir"?"internal":"referral";
  }catch{return "unknown";}
}
export async function ensureSourceSchema(db:any){
  await db.prepare("CREATE TABLE IF NOT EXISTS business_analytics_sources (business_id INTEGER NOT NULL,event_date TEXT NOT NULL,source TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(business_id,event_date,source))").run();
}
