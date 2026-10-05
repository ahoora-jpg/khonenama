export async function activateSubscriptionFromVerifiedPayment(db: any, paymentId: number) {
  const payment = await db.prepare(
    "SELECT pay.id,pay.status,pay.provider_reference,i.id invoice_id,i.business_id,i.plan_id,p.code plan_code,p.name plan_name,c.duration_days " +
    "FROM payments pay JOIN invoices i ON i.id=pay.invoice_id JOIN plans p ON p.id=i.plan_id " +
    "JOIN billing_checkouts c ON c.payment_id=pay.id AND c.business_id=i.business_id AND c.plan_code=p.code " +
    "JOIN billing_receipts r ON r.payment_id=pay.id AND r.provider=pay.provider AND r.reference=pay.provider_reference " +
    "WHERE pay.id=? AND pay.amount=i.total_amount AND pay.amount=c.amount_toman AND pay.currency='IRT' AND i.currency='IRT' AND i.status IN ('pending','paid')"
  ).bind(paymentId).first();
  if (!payment || payment.status !== "verified" || !payment.provider_reference || !["pro", "premium"].includes(payment.plan_code)) throw new Error("PAYMENT_NOT_VERIFIED");
  const payload = JSON.stringify({ activationId: crypto.randomUUID(), businessId: payment.business_id, planCode: payment.plan_code });
  const guard = "EXISTS(SELECT 1 FROM payment_events WHERE payment_id=? AND event_type='subscription_activated' AND payload_json=?)";
  // Atomic claim and renewal calculation keep duplicate or concurrent callbacks harmless.
  const result = await db.batch([
    db.prepare("INSERT INTO payment_events(payment_id,event_type,provider_code,payload_json) SELECT ?,'subscription_activated',?,? WHERE NOT EXISTS(SELECT 1 FROM payment_events WHERE payment_id=? AND event_type='subscription_activated') AND NOT EXISTS(SELECT 1 FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')) AND p.code='premium' AND ?='pro')").bind(paymentId, payment.provider_reference, payload, paymentId, payment.business_id, payment.plan_code),
    db.prepare("UPDATE billing_checkouts SET activation_ends_at=CASE WHEN EXISTS(SELECT 1 FROM subscriptions WHERE business_id=? AND plan_id=? AND status='active' AND ends_at IS NULL) THEN NULL ELSE datetime(COALESCE((SELECT MAX(datetime(s.ends_at)) FROM subscriptions s WHERE s.business_id=? AND s.plan_id=? AND s.status='active' AND julianday(s.ends_at)>julianday('now')),CURRENT_TIMESTAMP),'+' || duration_days || ' days') END WHERE payment_id=? AND " + guard).bind(payment.business_id, payment.plan_id, payment.business_id, payment.plan_id, paymentId, paymentId, payload),
    db.prepare("UPDATE subscriptions SET status='expired' WHERE business_id=? AND status='active' AND " + guard).bind(payment.business_id, paymentId, payload),
    db.prepare("INSERT INTO subscriptions(business_id,plan_id,status,starts_at,ends_at,is_test) SELECT ?,?,'active',CURRENT_TIMESTAMP,activation_ends_at,0 FROM billing_checkouts WHERE payment_id=? AND " + guard).bind(payment.business_id, payment.plan_id, paymentId, paymentId, payload),
    db.prepare("UPDATE invoices SET status='paid',paid_at=COALESCE(paid_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=? AND " + guard).bind(payment.invoice_id, paymentId, payload),
  ]);
  if (!result[0]?.meta?.changes && !await db.prepare("SELECT id FROM payment_events WHERE payment_id=? AND event_type='subscription_activated'").bind(paymentId).first()) throw new Error("PAID_PLAN_CONFLICT");
  return { ok: true, idempotent: !result[0]?.meta?.changes, businessId: Number(payment.business_id), planCode: String(payment.plan_code) };
}
