export async function activateSubscriptionFromVerifiedPayment(
  db: any,
  paymentId: number
) {
  const payment = await db
    .prepare(
      "SELECT pay.id, pay.status AS payment_status, pay.provider_reference, i.id AS invoice_id, i.status AS invoice_status, i.business_id, i.plan_id, p.code AS plan_code, p.name AS plan_name " +
      "FROM payments pay " +
      "JOIN invoices i ON i.id = pay.invoice_id " +
      "LEFT JOIN plans p ON p.id = i.plan_id " +
      "WHERE pay.id = ? LIMIT 1"
    )
    .bind(paymentId)
    .first();

  if (!payment?.id) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.payment_status !== "verified") {
    throw new Error("PAYMENT_NOT_VERIFIED");
  }

  if (!payment.business_id || !payment.plan_id || !payment.plan_code) {
    throw new Error("PAYMENT_PLAN_NOT_FOUND");
  }

  const alreadyActivated = await db
    .prepare(
      "SELECT id FROM payment_events WHERE payment_id = ? AND event_type = 'subscription_activated' LIMIT 1"
    )
    .bind(paymentId)
    .first();

  if (alreadyActivated?.id) {
    return {
      ok: true,
      idempotent: true,
      businessId: Number(payment.business_id),
      planCode: String(payment.plan_code),
    };
  }

  const endsAtSql =
    payment.plan_code === "free"
      ? "NULL"
      : "datetime('now', '+30 days')";

  await db.batch([
    db
      .prepare(
        "UPDATE invoices SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(payment.invoice_id),
    db
      .prepare(
        "UPDATE subscriptions SET status = 'expired', ends_at = COALESCE(ends_at, CURRENT_TIMESTAMP) WHERE business_id = ? AND status = 'active'"
      )
      .bind(payment.business_id),
    db
      .prepare(
        "INSERT INTO subscriptions (business_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, 'active', CURRENT_TIMESTAMP, " +
          endsAtSql +
          ")"
      )
      .bind(payment.business_id, payment.plan_id),
    db
      .prepare(
        "INSERT INTO payment_events (payment_id, event_type, provider_code, payload_json) VALUES (?, 'subscription_activated', ?, ?)"
      )
      .bind(
        paymentId,
        payment.provider_reference || null,
        JSON.stringify({
          businessId: Number(payment.business_id),
          planCode: String(payment.plan_code),
          activatedAt: new Date().toISOString(),
        })
      ),
  ]);

  return {
    ok: true,
    idempotent: false,
    businessId: Number(payment.business_id),
    planCode: String(payment.plan_code),
    planName: String(payment.plan_name || ""),
  };
}
