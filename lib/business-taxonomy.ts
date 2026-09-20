export type BusinessCategorySlug =
  | "curtain"
  | "flooring"
  | "carpet"
  | "wallpaper"
  | "interior-design";

export type BusinessCategoryOption = {
  slug: BusinessCategorySlug;
  label: string;
  services: readonly string[];
};

export const BUSINESS_CATEGORIES: readonly BusinessCategoryOption[] = [
  {
    slug: "curtain",
    label: "پرده و پوشش پنجره",
    services: [
      "پرده زبرا",
      "پرده شید",
      "پرده پارچه‌ای",
      "پرده پانچ",
      "پرده رومن",
      "پرده ورتیکال",
      "پرده کرکره‌ای",
      "اندازه‌گیری پرده",
      "دوخت پرده",
      "نصب و تعمیر پرده",
    ],
  },
  {
    slug: "flooring",
    label: "کفپوش، پارکت و لمینت",
    services: [
      "پارکت چوبی",
      "لمینت",
      "کفپوش PVC",
      "کفپوش SPC",
      "کفپوش وینیل",
      "کفپوش رولی",
      "قرنیز",
      "زیرسازی کف",
      "نصب کفپوش",
    ],
  },
  {
    slug: "carpet",
    label: "موکت",
    services: [
      "موکت رول",
      "موکت تایلی",
      "موکت اداری",
      "موکت هتلی",
      "موکت اتاق کودک",
      "اندازه‌گیری موکت",
      "زیرسازی موکت",
      "نصب موکت",
    ],
  },
  {
    slug: "wallpaper",
    label: "کاغذ دیواری و دیوارپوش",
    services: [
      "کاغذ دیواری",
      "کاغذ دیواری اتاق کودک",
      "پوستر دیواری",
      "دیوارپوش PVC",
      "دیوارپوش MDF",
      "ماربل شیت",
      "ترمووال",
      "پنل دکوراتیو",
      "زیرسازی دیوار",
      "نصب کاغذ دیواری و دیوارپوش",
    ],
  },
  {
    slug: "interior-design",
    label: "طراحی و اجرای دکوراسیون داخلی",
    services: [
      "طراحی داخلی",
      "طراحی سه‌بعدی",
      "مشاوره رنگ و متریال",
      "چیدمان و انتخاب مبلمان",
      "نورپردازی داخلی",
      "کناف و سقف کاذب",
      "تی‌وی وال",
      "پارتیشن و دیوایدر",
      "کابینت آشپزخانه",
      "کمد دیواری",
      "مصنوعات MDF و چوبی",
      "رنگ و پتینه",
      "آینه دکوراتیو",
      "بازسازی داخلی",
      "اجرا و نظارت پروژه",
    ],
  },
] as const;

export const BUSINESS_CATEGORY_BY_SLUG = Object.fromEntries(
  BUSINESS_CATEGORIES.map((item) => [item.slug, item])
) as Record<BusinessCategorySlug, BusinessCategoryOption>;

export function isBusinessCategorySlug(value: string): value is BusinessCategorySlug {
  return BUSINESS_CATEGORIES.some((item) => item.slug === value);
}

export function servicesForCategories(categories: readonly string[]) {
  const values = new Set<string>();
  for (const slug of categories) {
    if (!isBusinessCategorySlug(slug)) continue;
    for (const service of BUSINESS_CATEGORY_BY_SLUG[slug].services) values.add(service);
  }
  return [...values];
}

export function categoryForService(service: string, selectedCategories: readonly string[]) {
  for (const slug of selectedCategories) {
    if (!isBusinessCategorySlug(slug)) continue;
    if (BUSINESS_CATEGORY_BY_SLUG[slug].services.includes(service)) return slug;
  }
  return null;
}
