CREATE TABLE IF NOT EXISTS sms_removed_records (
 tenant_id TEXT NOT NULL REFERENCES sms_tenants(id), kind TEXT NOT NULL CHECK(kind IN('contact','campaign')),
 record_id TEXT NOT NULL, phone_hash TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,kind,record_id), UNIQUE(tenant_id,phone_hash)
);
