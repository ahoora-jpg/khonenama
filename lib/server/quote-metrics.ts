export async function recordSavedQuote(db:any,businessId:number,leadId:number){
 await db.prepare("CREATE TABLE IF NOT EXISTS business_analytics_daily (business_id INTEGER NOT NULL,event_date TEXT NOT NULL,profile_views INTEGER NOT NULL DEFAULT 0,phone_clicks INTEGER NOT NULL DEFAULT 0,whatsapp_clicks INTEGER NOT NULL DEFAULT 0,website_clicks INTEGER NOT NULL DEFAULT 0,instagram_clicks INTEGER NOT NULL DEFAULT 0,quote_starts INTEGER NOT NULL DEFAULT 0,quote_submits INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(business_id,event_date))").run();
 await db.prepare("CREATE TABLE IF NOT EXISTS business_quote_metric_receipts (lead_id INTEGER NOT NULL,business_id INTEGER NOT NULL,PRIMARY KEY(lead_id,business_id))").run();
 await db.batch([
  db.prepare("INSERT OR IGNORE INTO business_quote_metric_receipts(lead_id,business_id) SELECT lead_id,business_id FROM lead_recipients WHERE lead_id=? AND business_id=?").bind(leadId,businessId),
  db.prepare("INSERT INTO business_analytics_daily(business_id,event_date,quote_submits) SELECT ?,date('now'),1 WHERE changes()>0 ON CONFLICT(business_id,event_date) DO UPDATE SET quote_submits=quote_submits+1").bind(businessId),
 ]);
}
