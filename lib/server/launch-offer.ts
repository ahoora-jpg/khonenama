export async function ensureLaunchOffer(db: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS launch_offer_settings (id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER NOT NULL DEFAULT 0,starts_at TEXT,enrollment_days INTEGER NOT NULL DEFAULT 15,benefit_days INTEGER NOT NULL DEFAULT 60,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)").run();
  await db.prepare("INSERT OR IGNORE INTO launch_offer_settings(id) VALUES(1)").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS launch_offer_grants (owner_user_id TEXT PRIMARY KEY,business_id INTEGER NOT NULL,claim TEXT NOT NULL UNIQUE,benefit_days INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS launch_offer_changes (id INTEGER PRIMARY KEY,settings_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}

export async function applyLaunchOffer(db: any, businessId: number) {
  await ensureLaunchOffer(db);
  const claim = crypto.randomUUID();
  const gate = "EXISTS(SELECT 1 FROM launch_offer_grants WHERE business_id=? AND claim=?)";
  const result = await db.batch([
    db.prepare("INSERT OR IGNORE INTO launch_offer_grants(owner_user_id,business_id,claim,benefit_days) SELECT b.owner_user_id,b.id,?,o.benefit_days FROM businesses b JOIN launch_offer_settings o ON o.id=1 WHERE b.id=? AND b.status='published' AND o.enabled=1 AND julianday('now')>=julianday(o.starts_at) AND julianday('now')<julianday(o.starts_at,'+'||o.enrollment_days||' days') AND julianday(b.created_at)>=julianday(o.starts_at) AND julianday(b.created_at)<julianday(o.starts_at,'+'||o.enrollment_days||' days') AND EXISTS(SELECT 1 FROM plans WHERE code='pro' AND is_active=1) AND NOT EXISTS(SELECT 1 FROM businesses other WHERE other.owner_user_id=b.owner_user_id AND other.id<b.id) AND NOT EXISTS(SELECT 1 FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=b.id AND s.status='active' AND p.code!='free' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')))").bind(claim,businessId),
    db.prepare("UPDATE subscriptions SET status='expired' WHERE business_id=? AND status='active' AND "+gate).bind(businessId,businessId,claim),
    db.prepare("INSERT INTO subscriptions(business_id,plan_id,status,starts_at,ends_at,is_test) SELECT ?,p.id,'active',CURRENT_TIMESTAMP,datetime('now','+'||g.benefit_days||' days'),1 FROM plans p JOIN launch_offer_grants g ON g.business_id=? AND g.claim=? WHERE p.code='pro' AND p.is_active=1").bind(businessId,businessId,claim),
  ]);
  return Number(result[0]?.meta?.changes || 0)>0;
}
