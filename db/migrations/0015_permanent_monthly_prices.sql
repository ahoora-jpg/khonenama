UPDATE billing_prices
SET amount_toman=CASE plan_code WHEN 'pro' THEN 150000 WHEN 'premium' THEN 250000 END,
    duration_days=30,
    enabled=1,
    updated_at=CURRENT_TIMESTAMP
WHERE plan_code IN ('pro','premium');
