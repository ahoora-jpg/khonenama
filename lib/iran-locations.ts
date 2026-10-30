import cityRows from "@/data/iran-cities.json";
import { KARAJ_POPULAR_AREAS, suggestKarajAreas } from "@/lib/karaj-areas";

type CityRow = { name: string };

// City names are based on the MIT-licensed iran-cities data set.  The form never
// restricts input to this list: a newly named city or neighbourhood can always
// be entered and saved by the business owner.
export const IRAN_CITIES = [...new Set((cityRows as CityRow[])
  .map((row) => normalizeLocation(row.name))
  .filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa"));

export const ISFAHAN_AREAS = [
  "آبشار", "آزادی", "احمدآباد", "آرارات", "آینه‌خانه", "باغ زیار", "باغ غدیر",
  "باغ فردوس", "بهارستان", "بهار آزادی", "بلوار کشاورز", "بزرگمهر", "برزان",
  "پل فلزی", "توحید", "جلفا", "چهارباغ بالا", "چهارباغ عباسی", "خانه اصفهان",
  "دردشت", "دولت‌آباد", "رکن‌الدوله", "زینبیه", "سپاهان‌شهر", "سروش", "شیخ صدوق",
  "عباس‌آباد", "عاشق‌آباد", "فرح‌آباد", "فیض", "قصر", "کوی امام", "کوی پلیس",
  "مرداویج", "ملک‌شهر", "ناژوان", "نقش جهان", "هشت بهشت", "ولدان", "وحید",
] as const;

export function normalizeLocation(value: string) {
  return value
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]+/g, " ");
}

function matching(values: readonly string[], query: string, limit: number) {
  const normalized = normalizeLocation(query);
  if (!normalized) return values.slice(0, limit);
  return values
    .filter((value) => normalizeLocation(value).includes(normalized))
    .slice(0, limit);
}

export function suggestIranCities(query: string, limit = 12) {
  return matching(IRAN_CITIES, query, limit);
}

export function suggestCityAreas(city: string, query: string, limit = 10) {
  const normalizedCity = normalizeLocation(city);
  if (normalizedCity === "کرج") return suggestKarajAreas(query, limit);
  if (normalizedCity === "اصفهان") return matching(ISFAHAN_AREAS, query, limit);
  return [];
}

export function popularAreasForCity(city: string) {
  const normalizedCity = normalizeLocation(city);
  if (normalizedCity === "کرج") return KARAJ_POPULAR_AREAS;
  if (normalizedCity === "اصفهان") return ISFAHAN_AREAS.slice(0, 8);
  return [];
}
