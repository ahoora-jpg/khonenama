export type Business = {
  slug: string;
  name: string;
  category: string;
  area: string;
  city: string;
  description: string;
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  services: string[];
};

export const categories = [
  { slug: "curtain", name: "پرده و متعلقات" },
  { slug: "flooring", name: "کفپوش و پارکت" },
  { slug: "carpet", name: "موکت" },
  { slug: "wallpaper", name: "کاغذ دیواری" },
  { slug: "interior-design", name: "طراحی داخلی" },
];

export const businesses: Business[] = [
  {
    slug: "demo-curtain-baraghan",
    name: "نمونه پرده‌فروشی برغان",
    category: "curtain",
    area: "خیابان برغان",
    city: "کرج",
    description: "پروفایل نمایشی برای طراحی تجربه فروشگاه در خونه‌نما.",
    verified: true,
    featured: true,
    rating: 4.9,
    reviewCount: 38,
    services: ["پرده زبرا", "پرده شید", "پارچه پرده", "دوخت", "نصب"],
  },
  {
    slug: "demo-flooring-jahanshahr",
    name: "نمونه فروشگاه کفپوش",
    category: "flooring",
    area: "جهانشهر",
    city: "کرج",
    description: "پروفایل نمایشی برای پارکت، لمینت و اجرای کفپوش.",
    verified: true,
    featured: false,
    rating: 4.8,
    reviewCount: 21,
    services: ["پارکت", "لمینت", "PVC", "قرنیز", "نصب"],
  },
  {
    slug: "demo-wallpaper-gohardasht",
    name: "نمونه فروشگاه دیوارپوش",
    category: "wallpaper",
    area: "گوهردشت",
    city: "کرج",
    description: "پروفایل نمایشی برای کاغذ دیواری و دیوارپوش.",
    verified: false,
    featured: false,
    rating: 4.6,
    reviewCount: 17,
    services: ["کاغذ دیواری", "پوستر", "دیوارپوش", "نصب"],
  },
];

export function getBusiness(slug: string) {
  return businesses.find((business) => business.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
