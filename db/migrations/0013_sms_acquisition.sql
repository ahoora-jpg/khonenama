-- Additive: rollback code first and retain tables to preserve attribution history.
CREATE TABLE IF NOT EXISTS sms_acquisition_settings (
 tenant_id TEXT PRIMARY KEY REFERENCES sms_tenants(id), tracking_enabled INTEGER NOT NULL DEFAULT 1 CHECK(tracking_enabled IN(0,1))
);
INSERT OR IGNORE INTO sms_acquisition_settings(tenant_id) VALUES('khonenama');
CREATE TABLE IF NOT EXISTS sms_campaign_options (
 campaign_id TEXT PRIMARY KEY REFERENCES sms_campaigns(id), tracking_enabled INTEGER NOT NULL DEFAULT 0,
 destination TEXT NOT NULL DEFAULT '/register-business', expires_at TEXT, exclude_booth_owners INTEGER NOT NULL DEFAULT 1,
 cooldown_days INTEGER NOT NULL DEFAULT 7, tariff REAL, actual_cost REAL, variant_b TEXT
);
CREATE TABLE IF NOT EXISTS sms_contact_profiles (
 contact_id TEXT PRIMARY KEY REFERENCES sms_contacts(id), city TEXT NOT NULL DEFAULT '', area TEXT NOT NULL DEFAULT '', trade TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sms_recipient_links (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), campaign_id TEXT NOT NULL REFERENCES sms_campaigns(id),
 contact_id TEXT NOT NULL REFERENCES sms_contacts(id), token TEXT NOT NULL UNIQUE, destination TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)), expires_at TEXT, variant TEXT NOT NULL DEFAULT 'A',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(campaign_id,contact_id)
);
CREATE TABLE IF NOT EXISTS sms_link_events (
 id TEXT PRIMARY KEY, link_id TEXT NOT NULL REFERENCES sms_recipient_links(id), kind TEXT NOT NULL CHECK(kind IN('click','registration_view','registration_start','booth_start')),
 session_id TEXT NOT NULL, suspicious INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(link_id,kind,session_id)
);
CREATE INDEX IF NOT EXISTS idx_sms_link_events_time ON sms_link_events(link_id,created_at);
CREATE TABLE IF NOT EXISTS sms_click_totals (
 link_id TEXT PRIMARY KEY REFERENCES sms_recipient_links(id), total INTEGER NOT NULL DEFAULT 0, suspicious INTEGER NOT NULL DEFAULT 0,
 first_click TEXT, last_click TEXT
);
CREATE TABLE IF NOT EXISTS sms_attribution_sessions (
 id TEXT PRIMARY KEY, first_link_id TEXT NOT NULL REFERENCES sms_recipient_links(id), last_link_id TEXT NOT NULL REFERENCES sms_recipient_links(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sms_acquisition_conversions (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), first_link_id TEXT NOT NULL REFERENCES sms_recipient_links(id),
 last_link_id TEXT NOT NULL REFERENCES sms_recipient_links(id), user_id TEXT NOT NULL, business_id INTEGER,
 kind TEXT NOT NULL CHECK(kind IN('account_created','booth_created','booth_completed','booth_published')),
 identity_match INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(tenant_id,user_id,kind,business_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_new_account_once ON sms_acquisition_conversions(tenant_id,user_id) WHERE kind='account_created';
CREATE INDEX IF NOT EXISTS idx_sms_conversions_last ON sms_acquisition_conversions(last_link_id,kind);
CREATE INDEX IF NOT EXISTS idx_sms_conversions_first ON sms_acquisition_conversions(first_link_id,kind);
CREATE TABLE IF NOT EXISTS sms_message_costs (
 message_id TEXT PRIMARY KEY REFERENCES sms_messages(id), parts INTEGER NOT NULL, tariff REAL, estimated_cost REAL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sms_link_rate_buckets (
 bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

