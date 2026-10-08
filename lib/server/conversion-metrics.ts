// Aggregate counts only: never store phone numbers, names or request contents.
export async function recordConversion(db: any, event: "registration_start" | "business_registered" | "booth_published") {
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS marketplace_conversion_daily (event_date TEXT NOT NULL, event TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(event_date,event))").run();
    await db.prepare("INSERT INTO marketplace_conversion_daily(event_date,event,count) VALUES(date('now'),?,1) ON CONFLICT(event_date,event) DO UPDATE SET count=count+1").bind(event).run();
  } catch { console.warn("conversion count unavailable"); }
}
