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
