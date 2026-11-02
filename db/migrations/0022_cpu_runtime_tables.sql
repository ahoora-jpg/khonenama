-- Site D1 only. Additive: never replaces existing tables or stored policy timestamps.
-- Before deployment, run the separate media-column compatibility planner if necessary.
CREATE TABLE IF NOT EXISTS review_replies (review_id INTEGER PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, body TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS business_coverage_notes (business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE, note TEXT NOT NULL DEFAULT '');

CREATE TABLE IF NOT EXISTS business_installment_options(business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,show_installments INTEGER NOT NULL DEFAULT 0 CHECK(show_installments IN (0,1)),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS album_project_details (album_id INTEGER PRIMARY KEY REFERENCES business_albums(id) ON DELETE CASCADE, service TEXT NOT NULL, materials TEXT NOT NULL, area TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS business_models (business_id INTEGER PRIMARY KEY, names TEXT NOT NULL DEFAULT '[]');

CREATE TABLE IF NOT EXISTS business_campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL, terms TEXT NOT NULL, discount_percent INTEGER NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS campaign_participants (campaign_id INTEGER NOT NULL REFERENCES business_campaigns(id) ON DELETE CASCADE, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, consent TEXT NOT NULL DEFAULT 'invited', PRIMARY KEY(campaign_id,business_id));

CREATE TABLE IF NOT EXISTS business_push_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,user_id TEXT NOT NULL,expo_push_token TEXT NOT NULL UNIQUE,platform TEXT NOT NULL DEFAULT 'android',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_business_push_active ON business_push_tokens(business_id, active);

CREATE TABLE IF NOT EXISTS business_push_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,lead_id INTEGER NOT NULL,token_id INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,ticket_id TEXT,error_code TEXT,next_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(business_id,lead_id,token_id));

CREATE INDEX IF NOT EXISTS idx_push_outbox_due ON business_push_outbox(state,next_attempt);

CREATE TABLE IF NOT EXISTS web_push_keys (id INTEGER PRIMARY KEY CHECK(id=1),public_key TEXT NOT NULL,private_key TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS business_web_push (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,user_id TEXT NOT NULL,endpoint TEXT NOT NULL UNIQUE,subscription TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS business_web_push_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,lead_id INTEGER NOT NULL,subscription_id INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(business_id,lead_id,subscription_id));

CREATE INDEX IF NOT EXISTS idx_web_push_due ON business_web_push_outbox(state,next_attempt);

CREATE TABLE IF NOT EXISTS profile_photo_reminders(user_id TEXT PRIMARY KEY,business_id INTEGER NOT NULL,id TEXT NOT NULL UNIQUE DEFAULT(lower(hex(randomblob(16)))),state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,first_attempt_at TEXT,lease_until TEXT,lease_token TEXT,payload_json TEXT,provider_id TEXT,error_code TEXT,sent_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS profile_reminders_due ON profile_photo_reminders(state,next_attempt);

CREATE TABLE IF NOT EXISTS media_retention_policy(id INTEGER PRIMARY KEY CHECK(id=1),introduced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO media_retention_policy(id) VALUES(1);

CREATE TABLE IF NOT EXISTS media_retention_deletions(media_id INTEGER PRIMARY KEY,business_id INTEGER NOT NULL,provider TEXT NOT NULL,file_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
