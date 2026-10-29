CREATE TABLE IF NOT EXISTS sms_event_receipts (
 id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL DEFAULT 'khonenama',type TEXT NOT NULL,payload_hash TEXT NOT NULL,
 payload_json TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN('pending','processing','retry','done','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,lease_token TEXT,lease_until TEXT,applied_at TEXT,last_error TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sms_events_state ON sms_event_receipts(state,updated_at);
CREATE TABLE IF NOT EXISTS sms_event_outbox (
 id TEXT PRIMARY KEY,payload_hash TEXT NOT NULL,payload_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,queued_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sms_outbox_pending ON sms_event_outbox(queued_at,created_at);
CREATE TABLE IF NOT EXISTS sms_access_state_events (
 id TEXT PRIMARY KEY,scope TEXT NOT NULL CHECK(scope IN('link','lead')),subject_id TEXT NOT NULL,
 business_id INTEGER,lead_id INTEGER,link_id TEXT,previous_locked INTEGER,locked INTEGER NOT NULL,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,queued_at TEXT,processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sms_access_pending ON sms_access_state_events(queued_at,occurred_at);
CREATE INDEX IF NOT EXISTS idx_sms_access_link ON sms_access_state_events(link_id,occurred_at);
CREATE TRIGGER IF NOT EXISTS sms_link_initial_state AFTER INSERT ON sms_recipient_links BEGIN
 INSERT INTO sms_access_state_events(id,scope,subject_id,link_id,previous_locked,locked)
 VALUES(lower(hex(randomblob(16))),'link',NEW.id,NEW.id,NULL,CASE WHEN NEW.active=1 THEN 0 ELSE 1 END);
END;
CREATE TRIGGER IF NOT EXISTS sms_link_changed_state AFTER UPDATE OF active ON sms_recipient_links WHEN OLD.active<>NEW.active BEGIN
 INSERT INTO sms_access_state_events(id,scope,subject_id,link_id,previous_locked,locked)
 VALUES(lower(hex(randomblob(16))),'link',NEW.id,NEW.id,CASE WHEN OLD.active=1 THEN 0 ELSE 1 END,CASE WHEN NEW.active=1 THEN 0 ELSE 1 END);
END;
