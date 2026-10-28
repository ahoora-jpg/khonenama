-- «نردبان» آماده است، اما عمداً تا تصمیم مدیر در نمایش عمومی فعال نیست.
CREATE TABLE IF NOT EXISTS ladder_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  daily_price_toman INTEGER NOT NULL DEFAULT 10000 CHECK(daily_price_toman BETWEEN 1000 AND 100000),
  rotation_minutes INTEGER NOT NULL DEFAULT 3 CHECK(rotation_minutes BETWEEN 1 AND 60),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO ladder_settings(id) VALUES(1);

CREATE TABLE IF NOT EXISTS ladder_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  amount_toman INTEGER NOT NULL CHECK(amount_toman >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','expired','cancelled')),
  payment_reference TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ladder_entries_active
  ON ladder_entries(status, starts_at, ends_at, business_id);
