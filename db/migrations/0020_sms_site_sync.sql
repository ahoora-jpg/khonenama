CREATE TABLE IF NOT EXISTS sms_site_sync_outbox (
 id INTEGER PRIMARY KEY AUTOINCREMENT,entity TEXT NOT NULL,entity_key TEXT NOT NULL,operation TEXT NOT NULL,payload_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,queued_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sms_site_sync_pending ON sms_site_sync_outbox(queued_at,id);
CREATE TRIGGER IF NOT EXISTS sms_sync_users_insert AFTER INSERT ON users BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('user',CAST(NEW.id AS TEXT),'upsert',json_object('id',NEW.id,'phone',NEW.phone));
END;
CREATE TRIGGER IF NOT EXISTS sms_sync_users_update AFTER UPDATE OF phone ON users BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('user',CAST(NEW.id AS TEXT),'upsert',json_object('id',NEW.id,'phone',NEW.phone));
END;
CREATE TRIGGER IF NOT EXISTS sms_sync_users_delete AFTER DELETE ON users BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('user',CAST(OLD.id AS TEXT),'delete',json_object('id',OLD.id,'phone',OLD.phone));
END;
CREATE TRIGGER IF NOT EXISTS sms_sync_businesses_insert AFTER INSERT ON businesses BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('business',CAST(NEW.id AS TEXT),'upsert',json_object('id',NEW.id,'owner_user_id',NEW.owner_user_id,'status',NEW.status,'name',NEW.name,'phone',NEW.phone));
END;
CREATE TRIGGER IF NOT EXISTS sms_sync_businesses_update AFTER UPDATE OF owner_user_id,status,name,phone ON businesses BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('business',CAST(NEW.id AS TEXT),'upsert',json_object('id',NEW.id,'owner_user_id',NEW.owner_user_id,'status',NEW.status,'name',NEW.name,'phone',NEW.phone));
END;
CREATE TRIGGER IF NOT EXISTS sms_sync_businesses_delete AFTER DELETE ON businesses BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('business',CAST(OLD.id AS TEXT),'delete',json_object('id',OLD.id,'owner_user_id',OLD.owner_user_id,'status',OLD.status,'name',OLD.name,'phone',OLD.phone));
END;
