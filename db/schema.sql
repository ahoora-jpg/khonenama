PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  business_type TEXT,
  city TEXT NOT NULL,
  area TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  instagram TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','published','suspended')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified','pending','verified','professional')),
  is_featured INTEGER NOT NULL DEFAULT 0,
  owner_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_categories (
  business_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, category_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS business_services (
  business_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  PRIMARY KEY (business_id, service_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image' CHECK(kind IN ('image','logo','cover')),
  storage_key TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  reviewer_user_id TEXT,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected')),
  verified_interaction INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  city TEXT NOT NULL,
  area TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  request_text TEXT NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','matched','closed','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lead_recipients (
  lead_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  unlocked_at TEXT,
  price_credits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lead_id, business_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','past_due','cancelled','expired')),
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('boost','featured','sponsored')),
  city TEXT,
  category_id INTEGER,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','active','ended','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_businesses_city_area ON businesses(city, area);
CREATE INDEX IF NOT EXISTS idx_businesses_status_featured ON businesses(status, is_featured);
CREATE INDEX IF NOT EXISTS idx_business_categories_category ON business_categories(category_id, business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_status ON reviews(business_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_city_status ON leads(city, status);
CREATE INDEX IF NOT EXISTS idx_promotions_status_dates ON promotions(status, starts_at, ends_at);

INSERT OR IGNORE INTO categories (slug, name, sort_order) VALUES
  ('curtain', 'پرده و متعلقات', 10),
  ('flooring', 'کفپوش و پارکت', 20),
  ('carpet', 'موکت', 30),
  ('wallpaper', 'کاغذ دیواری', 40),
  ('interior-design', 'طراحی داخلی', 50);

INSERT OR IGNORE INTO plans (code, name, monthly_price) VALUES
  ('free', 'پایه', 0),
  ('pro', 'حرفه‌ای', 0),
  ('premium', 'ویژه', 0);


-- Business onboarding, access control and billing
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone_verified_at TEXT,
  email_verified_at TEXT,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER,
  password_set_at TEXT,
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


CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('email','sms')),
  destination TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user
ON password_reset_tokens(user_id, expires_at);
