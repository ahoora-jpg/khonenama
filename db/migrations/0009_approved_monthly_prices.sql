CREATE TABLE IF NOT EXISTS billing_configuration_versions (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO billing_price_audit(plan_code,amount_toman,duration_days,enabled) SELECT plan_code,CASE plan_code WHEN 'pro' THEN 250000 ELSE 350000 END,30,1 FROM billing_prices WHERE NOT EXISTS(SELECT 1 FROM billing_configuration_versions WHERE id='20261005-monthly-prices');
UPDATE billing_prices SET amount_toman=CASE plan_code WHEN 'pro' THEN 250000 ELSE 350000 END,duration_days=30,enabled=1,updated_at=CURRENT_TIMESTAMP WHERE NOT EXISTS(SELECT 1 FROM billing_configuration_versions WHERE id='20261005-monthly-prices');
INSERT OR IGNORE INTO billing_configuration_versions(id) VALUES('20261005-monthly-prices');
