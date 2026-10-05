export const billingSchema = [
  "CREATE TABLE IF NOT EXISTS billing_prices (plan_code TEXT PRIMARY KEY CHECK(plan_code IN ('pro','premium')), amount_toman INTEGER CHECK(amount_toman IS NULL OR amount_toman BETWEEN 1000 AND 100000000), duration_days INTEGER NOT NULL DEFAULT 30 CHECK(duration_days BETWEEN 1 AND 366), enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS billing_price_audit (id INTEGER PRIMARY KEY, plan_code TEXT NOT NULL, amount_toman INTEGER, duration_days INTEGER NOT NULL, enabled INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS billing_checkouts (id TEXT PRIMARY KEY, payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id), business_id INTEGER NOT NULL REFERENCES businesses(id), plan_code TEXT NOT NULL CHECK(plan_code IN ('pro','premium')), amount_toman INTEGER NOT NULL, duration_days INTEGER NOT NULL, request_key TEXT NOT NULL, callback_hash TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'web', activation_ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(business_id,request_key))",
  "CREATE TABLE IF NOT EXISTS billing_receipts (provider TEXT NOT NULL, reference TEXT NOT NULL, payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id), PRIMARY KEY(provider,reference))",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_authority ON payments(provider,provider_authority) WHERE provider_authority IS NOT NULL AND provider_authority <> ''",
];
export async function ensureBilling(db: any) {
  await db.batch(billingSchema.map(sql => db.prepare(sql)));
  await db.batch([db.prepare("INSERT OR IGNORE INTO billing_prices(plan_code) VALUES('pro')"), db.prepare("INSERT OR IGNORE INTO billing_prices(plan_code) VALUES('premium')")]);
}
