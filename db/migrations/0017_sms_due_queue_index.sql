CREATE INDEX IF NOT EXISTS idx_sms_due_dispatch ON sms_messages(
  tenant_id,gateway_id,COALESCE(julianday(scheduled_at),0),priority DESC,created_at,id
) WHERE status='queued';
