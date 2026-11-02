export type SecurityEvent = "login" | "password_recovery" | "payment_verification" | "secret_configuration" | "rate_limit" | "csrf_reject" | "admin_mutation" | "upload_reject" | "permission_denied";
export type SecurityOutcome = "allowed" | "denied" | "unavailable";

// No caller-supplied object / exception / URL / header is accepted here.
// Correlate through a random ID, not a phone, cookie, body or raw IP.
export function securityAudit(event: SecurityEvent, outcome: SecurityOutcome, status: number) {
  const requestId = crypto.randomUUID();
  console.info(JSON.stringify({ category: "security", event, outcome, status, requestId, at: new Date().toISOString() }));
  return requestId;
}
