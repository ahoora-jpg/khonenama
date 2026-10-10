CREATE TABLE IF NOT EXISTS billing_annual_prices (
  plan_code TEXT PRIMARY KEY CHECK(plan_code IN ('pro','premium')),
  amount_toman INTEGER NOT NULL CHECK(amount_toman BETWEEN 1000 AND 100000000),
  duration_days INTEGER NOT NULL DEFAULT 365 CHECK(duration_days=365),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1))
);
INSERT OR IGNORE INTO billing_annual_prices(plan_code,amount_toman) VALUES('pro',2500000);
INSERT OR IGNORE INTO billing_annual_prices(plan_code,amount_toman) VALUES('premium',3500000);
