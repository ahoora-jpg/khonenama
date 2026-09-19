PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone_verified_at TEXT,
  email_verified_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','blocked','deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_members (
  business_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('owner','manager','staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('invited','active','revoked')),
  invited_at TEXT,
  joined_at TEXT,
  PRIMARY KEY (business_id, user_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_service_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  city TEXT NOT NULL,
  area TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  weekday INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6),
  opens_at TEXT,
  closes_at TEXT,
  is_closed INTEGER NOT NULL DEFAULT 0,
  UNIQUE (business_id, weekday),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  requested_by_user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('phone','identity','license','business')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','needs_info')),
  document_storage_key TEXT,
  reviewer_user_id TEXT,
  reviewer_note TEXT,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  business_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  plan_id INTEGER,
  subtotal_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IRT',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','paid','failed','cancelled','expired','refunded')),
  description TEXT,
  expires_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_authority TEXT,
  provider_reference TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IRT',
  status TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','redirected','pending','verified','failed','cancelled','refunded')),
  idempotency_key TEXT UNIQUE,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  failed_at TEXT,
  raw_code TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  provider_code TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_service_areas_city_area ON business_service_areas(city, area, business_id);
CREATE INDEX IF NOT EXISTS idx_verification_business_status ON verification_requests(business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_business_status ON invoices(business_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_status ON payments(invoice_id, status);
