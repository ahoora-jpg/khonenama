CREATE TABLE IF NOT EXISTS business_visibility_controls (business_id INTEGER PRIMARY KEY,owner_paused INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
DROP TRIGGER IF EXISTS sms_sync_businesses_insert;
CREATE TRIGGER sms_sync_businesses_insert AFTER INSERT ON businesses BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('business',CAST(NEW.id AS TEXT),'upsert',json_object('id',NEW.id,'owner_user_id',NEW.owner_user_id,'status',NEW.status,'name',NEW.name,'phone',NEW.phone,'slug',NEW.slug));
END;
DROP TRIGGER IF EXISTS sms_sync_businesses_update;
CREATE TRIGGER sms_sync_businesses_update AFTER UPDATE OF owner_user_id,status,name,phone,slug ON businesses BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('business',CAST(NEW.id AS TEXT),'upsert',json_object('id',NEW.id,'owner_user_id',NEW.owner_user_id,'status',NEW.status,'name',NEW.name,'phone',NEW.phone,'slug',NEW.slug));
END;
DROP TRIGGER IF EXISTS sms_sync_businesses_delete;
CREATE TRIGGER sms_sync_businesses_delete AFTER DELETE ON businesses BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('business',CAST(OLD.id AS TEXT),'delete',json_object('id',OLD.id,'owner_user_id',OLD.owner_user_id,'status',OLD.status,'name',OLD.name,'phone',OLD.phone,'slug',OLD.slug));
END;
DROP TRIGGER IF EXISTS sms_sync_business_visibility_controls_insert;
CREATE TRIGGER sms_sync_business_visibility_controls_insert AFTER INSERT ON business_visibility_controls BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('visibility',CAST(NEW.business_id AS TEXT),'upsert',json_object('business_id',NEW.business_id,'owner_paused',NEW.owner_paused));
END;
DROP TRIGGER IF EXISTS sms_sync_business_visibility_controls_update;
CREATE TRIGGER sms_sync_business_visibility_controls_update AFTER UPDATE OF owner_paused ON business_visibility_controls BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('visibility',CAST(NEW.business_id AS TEXT),'upsert',json_object('business_id',NEW.business_id,'owner_paused',NEW.owner_paused));
END;
DROP TRIGGER IF EXISTS sms_sync_business_visibility_controls_delete;
CREATE TRIGGER sms_sync_business_visibility_controls_delete AFTER DELETE ON business_visibility_controls BEGIN
 INSERT INTO sms_site_sync_outbox(entity,entity_key,operation,payload_json) VALUES('visibility',CAST(OLD.business_id AS TEXT),'delete',json_object('business_id',OLD.business_id,'owner_paused',OLD.owner_paused));
END;
