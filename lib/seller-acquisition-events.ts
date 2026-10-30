export const sellerAcquisitionEvents = [
  "seller_landing_view",
  "seller_guide_view",
  "seller_registration_click",
  "registration_view",
  "registration_account_step",
  "registration_business_step",
  "registration_service_step",
  "registration_media_step",
  "registration_review_step",
  "registration_submit_attempt",
  "registration_submit_failed",
] as const;
export type SellerAcquisitionEvent = (typeof sellerAcquisitionEvents)[number];
export function sellerAcquisitionEvent(value: unknown): SellerAcquisitionEvent | null {
  return typeof value === "string" && sellerAcquisitionEvents.includes(value as SellerAcquisitionEvent)
    ? value as SellerAcquisitionEvent : null;
}
