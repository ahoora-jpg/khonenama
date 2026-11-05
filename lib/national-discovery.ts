import type { BusinessCategoryOption, BusinessCategorySlug } from "@/lib/business-taxonomy";

export const NATIONAL_DISCOVERY_CITIES = [
  { slug: "tehran", name: "تهران" }, { slug: "mashhad", name: "مشهد" },
  { slug: "isfahan", name: "اصفهان" }, { slug: "shiraz", name: "شیراز" },
  { slug: "tabriz", name: "تبریز" }, { slug: "karaj", name: "کرج" },
  { slug: "rasht", name: "رشت" }, { slug: "ahvaz", name: "اهواز" },
  { slug: "qom", name: "قم" }, { slug: "yazd", name: "یزد" },
  { slug: "kerman", name: "کرمان" }, { slug: "hamedan", name: "همدان" },
  { slug: "qazvin", name: "قزوین" }, { slug: "arak", name: "اراک" },
  { slug: "urmia", name: "ارومیه" }, { slug: "kermanshah", name: "کرمانشاه" },
  { slug: "bandarabbas", name: "بندرعباس" }, { slug: "sari", name: "ساری" },
  { slug: "gorgan", name: "گرگان" }, { slug: "bushehr", name: "بوشهر" },
  { slug: "sanandaj", name: "سنندج" }, { slug: "ardabil", name: "اردبیل" },
  { slug: "zanjan", name: "زنجان" }, { slug: "birjand", name: "بیرجند" },
  { slug: "bojnurd", name: "بجنورد" }, { slug: "ilam", name: "ایلام" },
  { slug: "khorramabad", name: "خرم‌آباد" }, { slug: "shahrekord", name: "شهرکرد" },
  { slug: "yasuj", name: "یاسوج" }, { slug: "zahedan", name: "زاهدان" },
  { slug: "semnan", name: "سمنان" },
] as const;

export type NationalDiscoveryCity = (typeof NATIONAL_DISCOVERY_CITIES)[number];

/**
 * These initial routes are editorial landing pages, not empty directories.
 * Each has category-specific decision guidance, connected guides/tools and a
 * clear seller path. They can be indexed even before a local booth exists.
 */
export const NATIONAL_DISCOVERY_INDEXABLE_ROUTES: ReadonlyArray<{
  citySlug: NationalDiscoveryCity["slug"];
  categorySlug: BusinessCategorySlug;
}> = [
  { citySlug: "isfahan", categorySlug: "curtain" },
  { citySlug: "isfahan", categorySlug: "flooring" },
  { citySlug: "isfahan", categorySlug: "carpet" },
  { citySlug: "isfahan", categorySlug: "wallpaper" },
  { citySlug: "tehran", categorySlug: "curtain" },
  { citySlug: "mashhad", categorySlug: "curtain" },
];

export function resolveNationalDiscovery(citySlug: string, categorySlug: string, categories: readonly BusinessCategoryOption[]) {
  const city = NATIONAL_DISCOVERY_CITIES.find((item) => item.slug === citySlug);
  const category = categories.find((item) => item.slug === categorySlug);
  return city && category ? { city, category } : null;
}

export function nationalDiscoveryPath(citySlug: string, categorySlug: BusinessCategorySlug) {
  return `/discover/${citySlug}/${categorySlug}`;
}

export function isIndexableNationalDiscoveryRoute(citySlug: string, categorySlug: string) {
  return NATIONAL_DISCOVERY_INDEXABLE_ROUTES.some((route) => route.citySlug === citySlug && route.categorySlug === categorySlug);
}

export function nationalDiscoveryCitiesForCategory(categorySlug: string) {
  return NATIONAL_DISCOVERY_CITIES.filter((city) => isIndexableNationalDiscoveryRoute(city.slug, categorySlug));
}
