PRAGMA foreign_keys = ON;

ALTER TABLE lead_recipients ADD COLUMN business_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE lead_recipients ADD COLUMN quoted_amount INTEGER;
ALTER TABLE lead_recipients ADD COLUMN private_note TEXT;
ALTER TABLE lead_recipients ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_lead_recipients_business_status
ON lead_recipients(business_id, business_status, lead_id);
