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
    galleryLimit: 10,
    albumLimit: null,
    analytics: false,
    reviewReply: false,
    promotedPlacement: false,
  },
  pro: {
    label: "حرفه‌ای",
    shortLabel: "حرفه‌ای",
    publicBadge: "حرفه‌ای",
    searchPriority: 10,
    galleryLimit: 30,
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
    galleryLimit: 70,
    albumLimit: null,
    analytics: true,
    reviewReply: true,
    promotedPlacement: true,
  },
};

export function normalizePlanCode(value: unknown): BusinessPlanCode {
  return value === "premium" || value === "pro" ? value : "free";
}
