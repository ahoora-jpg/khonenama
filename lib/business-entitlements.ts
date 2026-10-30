export type BusinessPlanCode = "free" | "pro" | "premium";

export const planPresentation: Record<BusinessPlanCode, {
  label: string;
  shortLabel: string;
  publicBadge: string | null;
  searchPriority: number;
  galleryLimit: number;
  albumLimit: number | null;
  analytics: boolean;
  reviewReply: boolean;
  promotedPlacement: boolean;
}> = {
  free: {
    label: "پایه",
    shortLabel: "پایه",
    publicBadge: null,
    searchPriority: 0,
    galleryLimit: 0,
    albumLimit: 0,
    analytics: false,
    reviewReply: false,
    promotedPlacement: false,
  },
  pro: {
    label: "حرفه‌ای",
    shortLabel: "حرفه‌ای",
    publicBadge: "حرفه‌ای",
    searchPriority: 10,
    galleryLimit: 2,
    albumLimit: null,
    analytics: true,
    reviewReply: true,
    promotedPlacement: false,
  },
  premium: {
    label: "ویژه",
    shortLabel: "ویژه",
    publicBadge: "ویژه",
    searchPriority: 20,
    galleryLimit: 4,
    albumLimit: null,
    analytics: true,
    reviewReply: true,
    promotedPlacement: true,
  },
};

export function normalizePlanCode(value: unknown): BusinessPlanCode {
  return value === "premium" || value === "pro" ? value : "free";
}
export const CUSTOM_PACK_PRICE = 15000;
export const CUSTOM_PACK_PHOTOS = 20;
export const CUSTOM_PACK_VIDEOS = 1;
export async function customPacksForSubscription(db:any, plan:{id?:number;code?:string}|null):Promise<number>{
  if(plan?.code!=="premium"||!plan.id)return 0;
  try{const row=await db.prepare("SELECT packs FROM subscription_custom_capacity WHERE subscription_id=?").bind(plan.id).first();return Number.isInteger(row?.packs)&&row.packs>=0&&Number.isSafeInteger(row.packs)?row.packs:0;}catch{return 0;}
}
