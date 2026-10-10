export const billingSchema = [
  "CREATE TABLE IF NOT EXISTS billing_annual_prices (plan_code TEXT PRIMARY KEY CHECK(plan_code IN ('pro','premium')), amount_toman INTEGER NOT NULL CHECK(amount_toman BETWEEN 1000 AND 100000000), duration_days INTEGER NOT NULL DEFAULT 365 CHECK(duration_days=365), enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)))",
  "CREATE TABLE IF NOT EXISTS billing_configuration_versions (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS billing_prices (plan_code TEXT PRIMARY KEY CHECK(plan_code IN ('pro','premium')), amount_toman INTEGER CHECK(amount_toman IS NULL OR amount_toman BETWEEN 1000 AND 100000000), duration_days INTEGER NOT NULL DEFAULT 30 CHECK(duration_days BETWEEN 1 AND 366), enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS billing_price_audit (id INTEGER PRIMARY KEY, plan_code TEXT NOT NULL, amount_toman INTEGER, duration_days INTEGER NOT NULL, enabled INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS billing_checkouts (id TEXT PRIMARY KEY, payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id), business_id INTEGER NOT NULL REFERENCES businesses(id), plan_code TEXT NOT NULL CHECK(plan_code IN ('pro','premium')), amount_toman INTEGER NOT NULL, duration_days INTEGER NOT NULL, request_key TEXT NOT NULL, callback_hash TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'web', activation_ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(business_id,request_key))",
  "CREATE TABLE IF NOT EXISTS billing_receipts (provider TEXT NOT NULL, reference TEXT NOT NULL, payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id), PRIMARY KEY(provider,reference))",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_authority ON payments(provider,provider_authority) WHERE provider_authority IS NOT NULL AND provider_authority <> ''",
];
// Owner-approved prices, applied once. Subsequent administrative edits remain authoritative.
export const approvedBillingPrices = [
  "INSERT INTO billing_price_audit(plan_code,amount_toman,duration_days,enabled) SELECT plan_code,CASE plan_code WHEN 'pro' THEN 250000 ELSE 350000 END,30,1 FROM billing_prices WHERE NOT EXISTS(SELECT 1 FROM billing_configuration_versions WHERE id='20261005-monthly-prices')",
  "UPDATE billing_prices SET amount_toman=CASE plan_code WHEN 'pro' THEN 250000 ELSE 350000 END,duration_days=30,enabled=1,updated_at=CURRENT_TIMESTAMP WHERE NOT EXISTS(SELECT 1 FROM billing_configuration_versions WHERE id='20261005-monthly-prices')",
  "INSERT OR IGNORE INTO billing_configuration_versions(id) VALUES('20261005-monthly-prices')",
];
export async function ensureBilling(db: any) {
  await db.batch(billingSchema.map(sql => db.prepare(sql)));
  await db.batch([db.prepare("INSERT OR IGNORE INTO billing_prices(plan_code) VALUES('pro')"), db.prepare("INSERT OR IGNORE INTO billing_prices(plan_code) VALUES('premium')")]);
  await db.batch(approvedBillingPrices.map(sql => db.prepare(sql)));
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO billing_annual_prices(plan_code,amount_toman) VALUES('pro',2500000)"),
    db.prepare("INSERT OR IGNORE INTO billing_annual_prices(plan_code,amount_toman) VALUES('premium',3500000)"),
  ]);
}
