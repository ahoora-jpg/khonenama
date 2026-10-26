PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sms_tenants (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1))
);
INSERT OR IGNORE INTO sms_tenants(id,name) VALUES('khonenama','خونه‌نما');

CREATE TABLE IF NOT EXISTS sms_contacts (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), phone_e164 TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'other', source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,phone_e164)
);
CREATE INDEX IF NOT EXISTS idx_sms_contacts_tenant ON sms_contacts(tenant_id,created_at);
CREATE TABLE IF NOT EXISTS sms_contact_groups (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,name)
);
CREATE TABLE IF NOT EXISTS sms_group_members (
  tenant_id TEXT NOT NULL, group_id TEXT NOT NULL REFERENCES sms_contact_groups(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES sms_contacts(id) ON DELETE CASCADE, PRIMARY KEY(group_id,contact_id)
);
CREATE TABLE IF NOT EXISTS sms_consents (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), contact_id TEXT NOT NULL REFERENCES sms_contacts(id),
  status TEXT NOT NULL CHECK(status IN ('granted','revoked')), method TEXT NOT NULL, text_version TEXT NOT NULL,
  evidence_ref TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sms_consents_contact ON sms_consents(tenant_id,contact_id,created_at DESC);
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  tenant_id TEXT NOT NULL, contact_id TEXT NOT NULL REFERENCES sms_contacts(id), source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(tenant_id,contact_id)
);
CREATE TABLE IF NOT EXISTS sms_templates (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), code TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('transactional','promotional')),
  body TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), name TEXT NOT NULL,
  body TEXT NOT NULL, group_id TEXT REFERENCES sms_contact_groups(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','running','paused','completed','cancelled')),
  scheduled_at TEXT, max_recipients INTEGER NOT NULL CHECK(max_recipients BETWEEN 1 AND 10000),
  approved_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
  campaign_id TEXT NOT NULL REFERENCES sms_campaigns(id), contact_id TEXT NOT NULL REFERENCES sms_contacts(id),
  message_id TEXT, PRIMARY KEY(campaign_id,contact_id)
);
CREATE TABLE IF NOT EXISTS sms_gateways (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), kind TEXT NOT NULL CHECK(kind='capcom6-local'),
  sim_number INTEGER NOT NULL DEFAULT 2 CHECK(sim_number=2), enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  inbound_enabled INTEGER NOT NULL DEFAULT 0 CHECK(inbound_enabled IN (0,1))
);
INSERT OR IGNORE INTO sms_gateways(id,tenant_id,kind,sim_number,enabled)
 VALUES('khonenama-android','khonenama','capcom6-local',2,0);
CREATE TABLE IF NOT EXISTS sms_gateway_agents (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), gateway_id TEXT NOT NULL REFERENCES sms_gateways(id),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)), last_seen_at TEXT, last_inbox_at TEXT, last_error TEXT
);
INSERT OR IGNORE INTO sms_gateway_agents(id,tenant_id,gateway_id,enabled)
 VALUES('khonenama-windows','khonenama','khonenama-android',0);
CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), contact_id TEXT NOT NULL REFERENCES sms_contacts(id),
  category TEXT NOT NULL CHECK(category IN ('transactional','promotional')),
  body TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','queued','leased','submitted','processed','sent','delivered','failed','unknown','cancelled')),
  priority INTEGER NOT NULL DEFAULT 0, idempotency_key TEXT NOT NULL, source_event TEXT,
  campaign_id TEXT REFERENCES sms_campaigns(id), gateway_id TEXT NOT NULL DEFAULT 'khonenama-android' REFERENCES sms_gateways(id),
  gateway_message_id TEXT, lease_token TEXT, lease_until TEXT, attempts INTEGER NOT NULL DEFAULT 0,
  scheduled_at TEXT, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_sms_dispatch ON sms_messages(status,scheduled_at,priority DESC,created_at);
CREATE INDEX IF NOT EXISTS idx_sms_reconcile ON sms_messages(status,updated_at);
CREATE TABLE IF NOT EXISTS sms_message_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, message_id TEXT NOT NULL REFERENCES sms_messages(id),
  state TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sms_delivery_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, message_id TEXT NOT NULL REFERENCES sms_messages(id),
  attempt INTEGER NOT NULL, gateway_message_id TEXT, result TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id,attempt)
);
CREATE TABLE IF NOT EXISTS sms_inbound_messages (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, gateway_inbound_id TEXT, sender_e164 TEXT NOT NULL,
  body TEXT NOT NULL, received_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sms_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
  target_id TEXT, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
