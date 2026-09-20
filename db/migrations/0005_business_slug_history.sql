PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS business_slug_history (
  old_slug TEXT PRIMARY KEY,
  business_id INTEGER NOT NULL,
  replaced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_slug_history_business
ON business_slug_history(business_id, replaced_at);
