-- Brand directory foundation. This migration is additive: no business, image, or public page is changed.
-- A brand is deliberately not public until an administrator sets status to 'published'.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','published','rejected','archived')),
  official_url TEXT,
  logo_storage_key TEXT,
  asset_rights_status TEXT NOT NULL DEFAULT 'not_collected' CHECK(asset_rights_status IN ('not_collected','owner_provided','licensed','approved_by_brand')),
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS business_brand_claims (
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('seller','installer','representative')),
  verification_status TEXT NOT NULL DEFAULT 'self_declared' CHECK(verification_status IN ('self_declared','pending_review','verified','rejected')),
  evidence_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, brand_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS brand_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  proposed_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'seller' CHECK(relationship_type IN ('seller','installer','representative')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  resolved_brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (business_id, normalized_name, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_brands_public ON brands(status, slug);
CREATE INDEX IF NOT EXISTS idx_brand_claims_brand ON business_brand_claims(brand_id, verification_status, business_id);
CREATE INDEX IF NOT EXISTS idx_brand_suggestions_review ON brand_suggestions(status, created_at);
