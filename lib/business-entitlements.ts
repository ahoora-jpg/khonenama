export type BusinessPlanCode = "free" | "pro" | "premium";

export const planPresentation: Record<BusinessPlanCode, {
  label: string;
  shortLabel: string;
  publicBadge: string | null;
  searchPriority: number;
  galleryLimit: number;
  analytics: boolean;
  reviewReply: boolean;
  promotedPlacement: boolean;
}> = {
  free: {
    label: "پایه",
    shortLabel: "پایه",
    publicBadge: null,
    searchPriority: 0,
    galleryLimit: 6,
    analytics: false,
    reviewReply: false,
    promotedPlacement: false,
  },
  pro: {
    label: "حرفه‌ای",
    shortLabel: "حرفه‌ای",
    publicBadge: "حرفه‌ای",
    searchPriority: 10,
    galleryLimit: 20,
    analytics: true,
    reviewReply: true,
    promotedPlacement: false,
  },
  premium: {
    label: "ویژه",
    shortLabel: "ویژه",
    publicBadge: "ویژه",
    searchPriority: 20,
    galleryLimit: 40,
    analytics: true,
    reviewReply: true,
    promotedPlacement: true,
  },
};

export function normalizePlanCode(value: unknown): BusinessPlanCode {
  return value === "premium" || value === "pro" ? value : "free";
}
