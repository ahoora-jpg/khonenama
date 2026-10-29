-- Requires the core store schema and migration 0018. No historical state is rewritten.
CREATE TRIGGER IF NOT EXISTS sms_lead_initial_access AFTER INSERT ON lead_recipients BEGIN
 INSERT INTO sms_access_state_events(id,scope,subject_id,business_id,lead_id,previous_locked,locked)
 VALUES(lower(hex(randomblob(16))),'lead',CAST(NEW.lead_id AS TEXT)||':'||CAST(NEW.business_id AS TEXT),NEW.business_id,NEW.lead_id,NULL,CASE WHEN NEW.unlocked_at IS NULL THEN 1 ELSE 0 END);
END;
CREATE TRIGGER IF NOT EXISTS sms_lead_changed_access AFTER UPDATE OF unlocked_at ON lead_recipients
 WHEN (OLD.unlocked_at IS NULL)<>(NEW.unlocked_at IS NULL) BEGIN
 INSERT INTO sms_access_state_events(id,scope,subject_id,business_id,lead_id,previous_locked,locked)
 VALUES(lower(hex(randomblob(16))),'lead',CAST(NEW.lead_id AS TEXT)||':'||CAST(NEW.business_id AS TEXT),NEW.business_id,NEW.lead_id,CASE WHEN OLD.unlocked_at IS NULL THEN 1 ELSE 0 END,CASE WHEN NEW.unlocked_at IS NULL THEN 1 ELSE 0 END);
END;
