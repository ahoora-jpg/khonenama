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
  media?: { url: string; alt: string; cover?: boolean }[];
};

export const categories = [
  { slug: "curtain", name: "پرده و متعلقات" },
  { slug: "flooring", name: "کفپوش و پارکت" },
  { slug: "carpet", name: "موکت" },
  { slug: "wallpaper", name: "کاغذ دیواری" },
  { slug: "interior-design", name: "طراحی داخلی" },
  { slug: "smart-home", name: "خانه هوشمند" },
];

// Discovery, category, local and profile routes must only expose real published
// businesses. Keep this collection empty until a future, explicitly isolated
// component needs clearly labelled visual-only demo content that is never part
// of public business discovery or structured data.
export const businesses: Business[] = [];

export function getBusiness(slug: string) {
  return businesses.find((business) => business.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
