// پایان روز ۱۵ بهمن ۱۴۰۵ به وقت ایران.
export const WELCOME_TRIAL_END = '2027-02-04 20:30:00';
export async function ensureWelcomeTrialSchema(db: any) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS business_welcome_trials (business_id INTEGER PRIMARY KEY, claim_token TEXT NOT NULL, starts_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, ends_at TEXT NOT NULL, subscription_id INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS business_welcome_notices (user_id TEXT PRIMARY KEY, dismissed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  ]);
}

export async function welcomeTrial(db: any, businessId: number, userId: string) {
  await ensureWelcomeTrialSchema(db);
  await db.batch([
    db.prepare("UPDATE subscriptions SET ends_at=? WHERE id IN (SELECT subscription_id FROM business_welcome_trials) AND is_test=1 AND plan_id IN (SELECT id FROM plans WHERE code IN ('pro','premium')) AND ends_at<>?").bind(WELCOME_TRIAL_END,WELCOME_TRIAL_END),
    db.prepare("UPDATE business_welcome_trials SET ends_at=? WHERE ends_at<>?").bind(WELCOME_TRIAL_END,WELCOME_TRIAL_END),
  ]);
  const token = crypto.randomUUID();
  const eligible = "EXISTS(SELECT 1 FROM businesses b WHERE b.id=? AND b.status IN ('draft','published') AND length(trim(b.name))>=2 AND length(trim(b.description))>=20 AND length(trim(b.city))>=2 AND length(trim(COALESCE(b.area,'')))>0 AND length(trim(COALESCE(b.address,'')))>0 AND length(trim(COALESCE(b.phone,'')))>0 AND EXISTS(SELECT 1 FROM business_services WHERE business_id=b.id) AND EXISTS(SELECT 1 FROM business_service_areas WHERE business_id=b.id))";
  const paid = "EXISTS(SELECT 1 FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND p.code IN ('pro','premium') AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')))";
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO business_welcome_trials(business_id,claim_token,ends_at) SELECT ?,?,? WHERE julianday('now')<julianday(?) AND " + eligible + " AND NOT " + paid + " AND EXISTS(SELECT 1 FROM plans WHERE code='pro')").bind(businessId,token,WELCOME_TRIAL_END,WELCOME_TRIAL_END,businessId,businessId),
    db.prepare("INSERT INTO subscriptions(business_id,plan_id,status,starts_at,ends_at,is_test) SELECT t.business_id,p.id,'active',t.starts_at,t.ends_at,1 FROM business_welcome_trials t JOIN plans p ON p.code='pro' WHERE t.business_id=? AND t.claim_token=? AND t.subscription_id IS NULL").bind(businessId,token),
    db.prepare("UPDATE business_welcome_trials SET subscription_id=(SELECT MAX(id) FROM subscriptions WHERE business_id=? AND is_test=1) WHERE business_id=? AND claim_token=? AND subscription_id IS NULL").bind(businessId,businessId,token),
  ]);
  const [trial,notice,current] = await Promise.all([
    db.prepare("SELECT starts_at,ends_at FROM business_welcome_trials WHERE business_id=?").bind(businessId).first(),
    db.prepare("SELECT user_id FROM business_welcome_notices WHERE user_id=?").bind(userId).first(),
    db.prepare("SELECT id FROM subscriptions WHERE business_id=? AND status='active' AND (ends_at IS NULL OR julianday(ends_at)>julianday('now')) AND is_test=0 AND plan_id IN (SELECT id FROM plans WHERE code IN ('pro','premium'))").bind(businessId).first(),
  ]);
  const open = await db.prepare("SELECT julianday('now')<julianday(?) AS open").bind(WELCOME_TRIAL_END).first();
  return { showNotice: Boolean(open?.open) && !notice && !current, trial: trial || null };
}
