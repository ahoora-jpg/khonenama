export const TENANT = "khonenama";
export const GATEWAY = "khonenama-android";

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.trim().replace(/[\s()-]/g, "").replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632));
  const iran = digits.replace(/^0098/, "+98").replace(/^98/, "+98").replace(/^0(?=9\d{9}$)/, "+98");
  if (/^\+989\d{9}$/.test(iran)) return iran;
  if (/^\+[1-9]\d{7,14}$/.test(iran)) return iran;
  return null;
}

export function isOptOut(text: unknown): boolean {
  return typeof text === "string" && /^(لغو|انصراف|STOP|UNSUBSCRIBE)$/iu.test(text.trim());
}

export function maskPhone(phone: string): string {
  return phone.length > 4 ? phone.slice(0, 3) + "••••••" + phone.slice(-4) : "••••";
}

export type SmsState = "draft" | "queued" | "leased" | "submitted" | "processed" | "sent" | "delivered" | "failed" | "unknown" | "cancelled";
const transitions: Record<SmsState, readonly SmsState[]> = {
  draft: ["queued", "cancelled"], queued: ["leased", "cancelled", "failed"],
  leased: ["submitted", "processed", "sent", "delivered", "failed", "unknown", "cancelled"],
  submitted: ["processed", "sent", "delivered", "failed", "unknown", "cancelled"],
  processed: ["sent", "delivered", "failed", "unknown"],
  sent: ["delivered", "failed"], delivered: ["failed"], failed: [], unknown: ["submitted", "processed", "sent", "delivered", "failed", "cancelled"], cancelled: [],
};
export function canTransition(from: SmsState, to: SmsState): boolean { return transitions[from]?.includes(to) ?? false; }

export function gatewayState(state: unknown): SmsState | null {
  switch (state) {
    case "Pending": return "submitted";
    case "Processed": return "processed";
    case "Sent": return "sent";
    case "Delivered": return "delivered";
    case "Failed": return "failed";
    case "Cancelled": return "cancelled";
    default: return null;
  }
}

export async function canReceivePromotionalMessage(db: any, contactId: string): Promise<boolean> {
  const row = await db.prepare(`SELECT 1 AS permitted FROM sms_contacts c
    WHERE c.id=? AND c.tenant_id=? AND NOT EXISTS
      (SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=c.tenant_id AND o.contact_id=c.id)`).bind(contactId, TENANT).first();
  return Boolean(row);
}

export function noStore(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
