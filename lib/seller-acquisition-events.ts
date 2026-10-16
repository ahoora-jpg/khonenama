export const sellerAcquisitionEvents = ["seller_landing_view", "seller_guide_view", "seller_registration_click"] as const;
export type SellerAcquisitionEvent = (typeof sellerAcquisitionEvents)[number];
export function sellerAcquisitionEvent(value: unknown): SellerAcquisitionEvent | null {
  return typeof value === "string" && sellerAcquisitionEvents.includes(value as SellerAcquisitionEvent)
    ? value as SellerAcquisitionEvent : null;
}
