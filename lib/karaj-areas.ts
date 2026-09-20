export const KARAJ_POPULAR_AREAS = [
  "عظیمیه",
  "جهانشهر",
  "گوهردشت",
  "مهرشهر",
  "باغستان",
  "برغان",
  "گلشهر",
  "حصارک",
] as const;

export const KARAJ_AREAS = [
  "آزادگان",
  "آق‌تپه",
  "اسلام‌آباد",
  "اصفهانی‌ها",
  "باغستان",
  "باغستان غربی",
  "برغان",
  "بهارستان",
  "پیشاهنگی",
  "چهارصد دستگاه",
  "حاجی‌آباد",
  "حسن‌آباد",
  "حصار",
  "حصارک بالا",
  "حصارک پایین",
  "حیدرآباد",
  "حسین‌آباد",
  "دهقان ویلا",
  "دولت‌آباد",
  "درختی",
  "رجایی‌شهر",
  "رزکان",
  "شاهین ویلا",
  "شهرک بنفشه",
  "شهرک جهان‌نما",
  "شهرک ظفر",
  "شهرک گلستان",
  "عظیمیه",
  "فاز ۱ مهرشهر",
  "فاز ۲ مهرشهر",
  "فاز ۳ مهرشهر",
  "فاز ۴ مهرشهر",
  "فاز ۵ مهرشهر",
  "قلمستان",
  "کلاک بالا",
  "کلاک پایین",
  "کوی امامیه",
  "کوی کارمندان جنوبی",
  "کوی کارمندان شمالی",
  "کیانمهر",
  "گلدشت",
  "گلشهر",
  "گوهردشت",
  "مصباح",
  "مهرویلا",
  "مهرشهر",
  "نوروزآباد",
  "وهرجرد",
  "جهانشهر",
  "کل کرج",
] as const;

function normalizePersian(value: string) {
  return value
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]+/g, " ");
}

export function suggestKarajAreas(query: string, limit = 8) {
  const normalized = normalizePersian(query);
  if (!normalized) return KARAJ_POPULAR_AREAS.slice(0, limit);

  const direct = KARAJ_AREAS.filter((area) =>
    normalizePersian(area).includes(normalized)
  );

  if (direct.length) return direct.slice(0, limit);

  const prefix = normalized.slice(0, Math.min(2, normalized.length));
  return KARAJ_AREAS
    .filter((area) => normalizePersian(area).startsWith(prefix))
    .slice(0, limit);
}
