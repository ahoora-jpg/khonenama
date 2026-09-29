export type LocalCategorySlug =
  | "curtain"
  | "flooring"
  | "carpet"
  | "wallpaper"
  | "interior-design"
  | "smart-home";

export type MarketConfidence =
  | "confirmed_bursa"
  | "strong_cluster"
  | "specialist_cluster"
  | "distribution_center"
  | "parent_market";

export type PublishStatus = "research" | "city-ready" | "market-ready";

export type LocalMarket = {
  citySlug: string;
  city: string;
  province: string;
  marketSlug: string;
  name: string;
  categories: LocalCategorySlug[];
  confidence: MarketConfidence;
  publishStatus: PublishStatus;
  notes?: string;
  sources?: { name: string; url: string }[];
};
export const localMarkets: LocalMarket[] = [
  {
    citySlug: "karaj", city: "کرج", province: "البرز", marketSlug: "baraghan",
    name: "خیابان برغان", categories: ["curtain"], confidence: "confirmed_bursa", publishStatus: "market-ready",
    sources: [
      { name: "پرده نفیس در خیابان برغان", url: "https://www.waze.com/live-map/directions/ir/krj/prdh-nfys?to=place.ChIJfe3TOwC_jT8Rh9VWy0bNpIg" },
      { name: "فهرست پرده‌فروشی‌های کرج", url: "https://faratat.com/city/karaj/%D9%85%D8%B9%D8%B1%D9%81%DB%8C-15-%D8%AA%D8%A7-%D8%A7%D8%B2-%D8%A8%D9%87%D8%AA%D8%B1%DB%8C%D9%86-%D9%BE%D8%B1%D8%AF%D9%87-%D9%81%D8%B1%D9%88%D8%B4%DB%8C-%D8%AF%D8%B1-%DA%A9%D8%B1%D8%AC/" },
    ],
  },
  {
    citySlug: "karaj", city: "کرج", province: "البرز", marketSlug: "mianjadeh-haddadi",
    name: "میانجاده و بلوار شهید حدادی", categories: ["curtain", "wallpaper", "flooring"],
    confidence: "strong_cluster", publishStatus: "market-ready",
    sources: [
      { name: "فروشگاه‌های بلوار حدادی", url: "https://iran-streets.openalfa.com/alborz-province/shopping" },
    ],
  },
  {
    citySlug: "karaj", city: "کرج", province: "البرز", marketSlug: "malard-road-fardis",
    name: "محور جاده ملارد و فردیس", categories: ["curtain"], confidence: "strong_cluster", publishStatus: "market-ready",
    sources: [{ name: "بورس پرده وزراء", url: "https://t.me/s/parde_vozara?before=813" }],
  },
  { citySlug: "tehran", city: "تهران", province: "تهران", marketSlug: "molavi", name: "مولوی", categories: ["curtain"], confidence: "confirmed_bursa", publishStatus: "research" },
  { citySlug: "tehran", city: "تهران", province: "تهران", marketSlug: "abdolabad", name: "عبدل‌آباد", categories: ["curtain", "wallpaper"], confidence: "confirmed_bursa", publishStatus: "research" },
  { citySlug: "tehran", city: "تهران", province: "تهران", marketSlug: "sohrevardi", name: "سهروردی", categories: ["curtain", "flooring", "carpet", "wallpaper", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "tehran", city: "تهران", province: "تهران", marketSlug: "lalezar", name: "لاله‌زار", categories: ["smart-home"], confidence: "parent_market", publishStatus: "research", notes: "بازار مادر برق و اتوماسیون؛ نه بورس اختصاصی خانه هوشمند." },

  { citySlug: "mashhad", city: "مشهد", province: "خراسان رضوی", marketSlug: "qarani", name: "بلوار قرنی و تعبدی", categories: ["curtain"], confidence: "confirmed_bursa", publishStatus: "research" },
  { citySlug: "mashhad", city: "مشهد", province: "خراسان رضوی", marketSlug: "felestin", name: "فلسطین", categories: ["wallpaper", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "mashhad", city: "مشهد", province: "خراسان رضوی", marketSlug: "ahmadabad", name: "احمدآباد", categories: ["wallpaper", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },

  { citySlug: "isfahan", city: "اصفهان", province: "اصفهان", marketSlug: "rabat", name: "رباط دوم و سوم", categories: ["wallpaper", "flooring", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "isfahan", city: "اصفهان", province: "اصفهان", marketSlug: "hakim-bazaar", name: "بازار بزرگ و خیابان حکیم", categories: ["curtain"], confidence: "specialist_cluster", publishStatus: "research" },

  { citySlug: "shiraz", city: "شیراز", province: "فارس", marketSlug: "vakil", name: "بازار وکیل", categories: ["curtain"], confidence: "specialist_cluster", publishStatus: "research" },
  { citySlug: "shiraz", city: "شیراز", province: "فارس", marketSlug: "zargari", name: "زرگری", categories: ["curtain", "wallpaper", "flooring", "carpet"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "shiraz", city: "شیراز", province: "فارس", marketSlug: "qasrdasht-rahmatabad", name: "قصردشت و رحمت‌آباد", categories: ["curtain", "wallpaper", "flooring", "carpet", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "tabriz", city: "تبریز", province: "آذربایجان شرقی", marketSlug: "qiam-qaranikhaneh", name: "پاساژ قیام و قره‌نی‌خانه", categories: ["curtain"], confidence: "confirmed_bursa", publishStatus: "research" },
  { citySlug: "ahvaz", city: "اهواز", province: "خوزستان", marketSlug: "imam-khomeini", name: "بازار امام خمینی", categories: ["curtain"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "ahvaz", city: "اهواز", province: "خوزستان", marketSlug: "koy-mellat", name: "کوی ملت و کوروش", categories: ["curtain", "carpet", "flooring", "wallpaper"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "rasht", city: "رشت", province: "گیلان", marketSlug: "shariati-takhti", name: "شریعتی، پاساژ کویتی و تختی", categories: ["curtain"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "rasht", city: "رشت", province: "گیلان", marketSlug: "golsar-takhti", name: "گلسار و تختی", categories: ["curtain", "flooring", "wallpaper", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "yazd", city: "یزد", province: "یزد", marketSlug: "azadshahr", name: "آزادشهر", categories: ["curtain"], confidence: "specialist_cluster", publishStatus: "research" },
  { citySlug: "arak", city: "اراک", province: "مرکزی", marketSlug: "doctor-hesabi", name: "خیابان دکتر حسابی", categories: ["curtain", "wallpaper", "flooring", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "zanjan", city: "زنجان", province: "زنجان", marketSlug: "besat", name: "خیابان بعثت", categories: ["curtain", "wallpaper", "flooring", "carpet", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "urmia", city: "ارومیه", province: "آذربایجان غربی", marketSlug: "madani-2", name: "خیابان مدنی ۲", categories: ["flooring", "wallpaper", "interior-design"], confidence: "specialist_cluster", publishStatus: "research" },
  { citySlug: "birjand", city: "بیرجند", province: "خراسان جنوبی", marketSlug: "tohid-44", name: "توحید ۴۴", categories: ["wallpaper", "flooring"], confidence: "specialist_cluster", publishStatus: "research" },
  { citySlug: "semnan", city: "سمنان", province: "سمنان", marketSlug: "rajaei", name: "رجایی", categories: ["curtain", "wallpaper", "flooring"], confidence: "specialist_cluster", publishStatus: "research" },
  { citySlug: "sanandaj", city: "سنندج", province: "کردستان", marketSlug: "felestin", name: "خیابان فلسطین", categories: ["curtain", "flooring", "carpet", "wallpaper"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "kermanshah", city: "کرمانشاه", province: "کرمانشاه", marketSlug: "modarres-resalat", name: "مدرس و پاساژ رسالت", categories: ["curtain", "wallpaper", "flooring"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "qom", city: "قم", province: "قم", marketSlug: "bajak", name: "باجک ۱ و خیابان باجک", categories: ["curtain", "wallpaper", "flooring"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "kerman", city: "کرمان", province: "کرمان", marketSlug: "parvin-etesami", name: "پروین اعتصامی شرقی", categories: ["curtain", "wallpaper", "flooring", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "bushehr", city: "بوشهر", province: "بوشهر", marketSlug: "enghelab", name: "خیابان انقلاب", categories: ["wallpaper", "flooring", "interior-design"], confidence: "specialist_cluster", publishStatus: "research" },
  { citySlug: "sari", city: "ساری", province: "مازندران", marketSlug: "sheikh-tabarsi", name: "شیخ طبرسی", categories: ["curtain", "wallpaper", "flooring", "carpet", "interior-design"], confidence: "strong_cluster", publishStatus: "research" },
  { citySlug: "bojnurd", city: "بجنورد", province: "خراسان شمالی", marketSlug: "ghiam-modarres", name: "قیام و بلوار مدرس", categories: ["interior-design"], confidence: "specialist_cluster", publishStatus: "research", notes: "بیشتر مرتبط با پارچه مبلی و دکوراسیون؛ قبل از انتشار باید دوباره بررسی شود." },
];

export function getMarketsForCity(citySlug: string) {
  return localMarkets.filter((market) => market.citySlug === citySlug);
}

export function getPublishableMarkets(citySlug?: string) {
  return localMarkets.filter((market) =>
    market.publishStatus === "market-ready" && (!citySlug || market.citySlug === citySlug)
  );
}

export function getResearchCities() {
  return [...new Map(localMarkets.map((market) => [market.citySlug, { slug: market.citySlug, city: market.city, province: market.province }])).values()];
}
