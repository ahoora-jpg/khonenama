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
  if(phone.startsWith('removed:'))return 'مخاطب حذف‌شده';
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
    WHERE c.id=? AND c.tenant_id=? AND c.source<>'removed' AND NOT EXISTS
      (SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=c.tenant_id AND o.contact_id=c.id)`).bind(contactId, TENANT).first();
  return Boolean(row);
}
export async function phoneHash(phone:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(TENANT+'|'+phone))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function wasPhoneRemoved(db:any,phone:string){return Boolean(await db.prepare("SELECT 1 FROM sms_removed_records WHERE tenant_id=? AND kind='contact' AND phone_hash=?").bind(TENANT,await phoneHash(phone)).first());}
export async function removeSmsContact(db:any,id:string){
 const contact=await db.prepare("SELECT phone_e164 FROM sms_contacts WHERE id=? AND tenant_id=? AND source<>'removed'").bind(id,TENANT).first();
 if(!contact)return {ok:false,error:'CONTACT_NOT_FOUND'};
 const hash=await phoneHash(contact.phone_e164);
 const guard="EXISTS(SELECT 1 FROM sms_removed_records WHERE tenant_id='khonenama' AND kind='contact' AND record_id=?)";
 await db.batch([
 db.prepare("INSERT OR IGNORE INTO sms_removed_records(tenant_id,kind,record_id,phone_hash) SELECT ?,'contact',?,? WHERE NOT EXISTS(SELECT 1 FROM sms_messages WHERE tenant_id=? AND contact_id=? AND status='leased')").bind(TENANT,id,hash,TENANT,id),
 db.prepare(`UPDATE sms_messages SET body='[مخاطب حذف شده]',status=CASE WHEN status IN('draft','queued') THEN 'cancelled' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND contact_id=? AND ${guard}`).bind(TENANT,id,id),
 db.prepare(`DELETE FROM sms_inbound_messages WHERE tenant_id=? AND sender_e164=? AND ${guard}`).bind(TENANT,contact.phone_e164,id),
 ...['sms_group_members','sms_contact_profiles','sms_consents'].map(table=>db.prepare(`DELETE FROM ${table} WHERE contact_id=? AND ${guard}`).bind(id,id)),
 db.prepare(`UPDATE sms_recipient_links SET active=0 WHERE tenant_id=? AND contact_id=? AND ${guard}`).bind(TENANT,id,id),
 db.prepare(`UPDATE sms_contacts SET phone_e164='removed:'||id,display_name='',kind='other',source='removed' WHERE tenant_id=? AND id=? AND ${guard}`).bind(TENANT,id,id)
 ]);
 return await db.prepare("SELECT 1 FROM sms_removed_records WHERE tenant_id=? AND kind='contact' AND record_id=?").bind(TENANT,id).first()?{ok:true}:{ok:false,error:'CONTACT_BUSY'};
}

export function noStore(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
