export const CLAIM_SQL = `UPDATE sms_messages SET status='leased',lease_token=?,lease_until=datetime('now','+2 minutes'),
  attempts=attempts+1,updated_at=CURRENT_TIMESTAMP WHERE id=(
    SELECT m.id FROM sms_messages m JOIN sms_contacts c ON c.id=m.contact_id
    WHERE m.tenant_id=? AND m.status='queued' AND m.gateway_id=?
      AND m.body NOT LIKE '%{{%'
      AND (m.scheduled_at IS NULL OR julianday(m.scheduled_at)<=julianday('now'))
      AND julianday(m.expires_at)>julianday('now')
      AND (m.campaign_id IS NULL OR EXISTS(SELECT 1 FROM sms_campaigns campaign WHERE campaign.id=m.campaign_id AND campaign.status IN ('running','completed')))
      AND (m.category='transactional' OR (
        EXISTS(SELECT 1 FROM sms_gateways gateway WHERE gateway.id=m.gateway_id AND gateway.inbound_enabled=1)
        AND EXISTS(SELECT 1 FROM sms_gateway_agents agent WHERE agent.gateway_id=m.gateway_id AND agent.last_inbox_at>=datetime('now','-5 minutes'))
        AND
        NOT EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=m.tenant_id AND o.contact_id=m.contact_id)
      ))
      AND NOT EXISTS(SELECT 1 FROM sms_messages recent WHERE recent.gateway_id=m.gateway_id AND recent.attempts>0 AND recent.updated_at>datetime('now',?))
    ORDER BY m.priority DESC,m.created_at,m.id LIMIT 1
  ) AND status='queued' RETURNING id,contact_id,body,expires_at,lease_token,lease_until,attempts`;
