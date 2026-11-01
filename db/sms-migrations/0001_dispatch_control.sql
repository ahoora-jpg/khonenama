-- SMS database only. Additive; do not apply to the main site database.
CREATE TABLE IF NOT EXISTS sms_dispatch_control (tenant_id TEXT PRIMARY KEY REFERENCES sms_tenants(id),paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN(0,1)),revision INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sms_retry_receipts (tenant_id TEXT NOT NULL REFERENCES sms_tenants(id),original_id TEXT NOT NULL REFERENCES sms_messages(id),retry_id TEXT NOT NULL UNIQUE REFERENCES sms_messages(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(tenant_id,original_id));
CREATE INDEX IF NOT EXISTS idx_sms_retry_contact_state ON sms_messages(tenant_id,contact_id,status);
CREATE INDEX IF NOT EXISTS idx_sms_campaign_state ON sms_messages(tenant_id,campaign_id,status);
CREATE TRIGGER IF NOT EXISTS sms_dispatch_insert_audit AFTER INSERT ON sms_dispatch_control BEGIN INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(NEW.tenant_id,'site_admin','dispatch_control',NEW.tenant_id,CAST(NEW.paused AS TEXT)); END;
CREATE TRIGGER IF NOT EXISTS sms_dispatch_update_audit AFTER UPDATE OF paused ON sms_dispatch_control WHEN OLD.paused<>NEW.paused BEGIN INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(NEW.tenant_id,'site_admin','dispatch_control',NEW.tenant_id,CAST(NEW.paused AS TEXT)); END;
