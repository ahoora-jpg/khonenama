PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lead_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  amount INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','sent','accepted','rejected','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lead_id, business_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lead_quotes_business
ON lead_quotes(business_id, status, updated_at);
