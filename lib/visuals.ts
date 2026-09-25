export type EditorialVisual = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sourcePage?: string;
};

export const editorialVisuals = {
  curtain: {
    src: "https://images.unsplash.com/photo-1602612996819-3cd306f68b4e?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کرکره و پرده پنجره با نور طبیعی در فضای داخلی",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/white-window-blinds-on-window-Bij3VCHV9e8",
  },
  flooring: {
    src: "https://images.unsplash.com/photo-1581688127942-81aa836de621?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کفپوش چوبی روشن در فضای داخلی کنار پنجره",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/",
  },
  carpet: {
    src: "https://images.unsplash.com/photo-1661820030641-35d02e9e9b37?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "فرش و پوشش کف در نشیمن روشن و مدرن",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/",
  },
  wallpaper: {
    src: "https://images.unsplash.com/photo-1742799431910-985c27143e98?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کاغذ دیواری طرح‌دار روی دیوار فضای داخلی",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/",
  },
  interiorDesign: {
    src: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "چیدمان و طراحی داخلی نشیمن مدرن با نور طبیعی",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/",
  },
  smartHome: {
    src: "https://images.unsplash.com/photo-1770625467638-964f594712e3?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "پنل کنترل و ترموستات هوشمند نصب‌شده روی دیوار",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/modern-smart-home-control-panel-on-white-wall-RMdMq47NDcU",
  },
} satisfies Record<string, EditorialVisual>;

export const localVisuals = {
  curtain: {
    src: "https://images.unsplash.com/photo-1518002903142-1f4ef6851390?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کرکره افقی سفید کنار گیاه سبز و پنجره برای انتخاب پرده در کرج",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/white-closed-window-blind-near-green-leaf-plant-inside-room-3fjO_A5tmHE",
  },
  flooring: {
    src: "https://images.unsplash.com/photo-1624900044729-fe57757bbaaa?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کف چوبی و سطح پارکت برای مقایسه کفپوش و لمینت در کرج",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/brown-wooden-floor-with-white-wall-teha6h4X8_s",
  },
  carpet: {
    src: "https://images.unsplash.com/photo-1722942117261-ec876f53cc5b?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "بافت موکت و قالیچه روی کف چوبی برای انتخاب پوشش کف در کرج",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/a-close-up-of-a-rug-on-a-wooden-floor-an8peUcqEl8",
  },
  wallpaper: {
    src: "https://images.unsplash.com/photo-1780672824152-e671d2470d78?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کاغذ دیواری راه‌راه در فضای داخلی برای انتخاب طرح و رنگ در کرج",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/striped-wallpaper-with-a-framed-lighthouse-picture-and-a-window-Q81cvu-2S4c",
  },
  interiorDesign: {
    src: "https://images.unsplash.com/photo-1722649937429-88eda88e4dee?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "نشیمن مبله با نور طبیعی برای بررسی طراحی داخلی و چیدمان در کرج",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/a-living-room-filled-with-furniture-and-a-large-window-E0dTAILYc6Q",
  },
  smartHome: {
    src: "https://images.unsplash.com/photo-1774876549476-254b00a5d648?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "ترموستات هوشمند مشکی نصب‌شده روی دیوار برای کنترل خانه هوشمند",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/a-modern-black-thermostat-mounted-on-a-wall-j5UKEK7w8DQ",
  },
} satisfies Record<string, EditorialVisual>;

const guideVisuals: Record<string, EditorialVisual> = {
  "curtain-installation-guide": {
    src: "https://images.unsplash.com/photo-1495652286171-4bba4cd113c5?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "پرده کرکره‌ای روشن روی پنجره برای بررسی محل نصب",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/white-window-blinds-LG5Ki6IGfKE",
  },
  "shade-curtain-guide": {
    src: "https://images.unsplash.com/photo-1598242822528-182185460969?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "پرده شید در فضای داخلی روشن کنار پنجره",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/",
  },
  "smart-curtain-daylight-guide": {
    src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "فضای داخلی هوشمند با نور طبیعی و کنترل روشنایی و پرده",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/",
  },
  "parquet-vs-laminate": {
    src: "https://images.unsplash.com/photo-1572536578813-c0b93acacdb6?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "کف چوبی در فضای داخلی برای مقایسه پارکت طبیعی و لمینت",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/brown-wooden-floor-and-white-walls-0KU_loIN234",
  },
  "wallpaper-guide": {
    src: "https://images.unsplash.com/photo-1565031608970-1c52f6a768aa?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "بافت و طرح سطح دیوار برای راهنمای انتخاب کاغذ دیواری",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/gray-13-wall-decor-Vd87rgA53CE",
  },
  "interior-design-trends-2026": {
    src: "https://images.unsplash.com/photo-1631048499453-b1342a519efc?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "فضای غذاخوری طراحی‌شده برای بررسی رنگ، چیدمان و ترندهای داخلی",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/rectangular-white-table-with-chairs-jm7HYtcW2VM",
  },
  "smart-home-guide": {
    src: "https://images.unsplash.com/photo-1770625467384-304e461ef1be?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "دست در حال تنظیم ترموستات دیجیتال برای شروع خانه هوشمند",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/finger-adjusting-a-modern-digital-thermostat-on-wall-3_nf1qKJGf4",
  },
  "carpet-types-guide": {
    src: "https://images.unsplash.com/photo-1759742268946-8a145d543ac4?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "چند نمونه بافت و طرح فرش و موکت برای مقایسه پوشش‌های کف",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/various-patterned-rugs-displayed-side-by-side-jGRP95K4ujI",
  },
  "zebra-curtain-guide": {
    src: "https://images.unsplash.com/photo-1770011916982-ac9fcebc8fb8?auto=format&fit=crop&w=1600&h=900&q=82",
    alt: "پنجره مدرن و پوشش پنجره برای آشنایی با پرده‌های زبرا و کرکره‌ای",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/a-modern-window-with-white-frames-and-green-blinds-WqOmnC95c3I",
  },
};

function stableIndex(value: string, size: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash % size;
}

function fallbackGuidePool(category: string): EditorialVisual[] {
  if (category === "پرده") return [editorialVisuals.curtain, localVisuals.curtain, guideVisuals["zebra-curtain-guide"], guideVisuals["shade-curtain-guide"]];
  if (category === "کفپوش") return [editorialVisuals.flooring, localVisuals.flooring, guideVisuals["parquet-vs-laminate"]];
  if (category === "موکت") return [editorialVisuals.carpet, localVisuals.carpet, guideVisuals["carpet-types-guide"]];
  if (category === "کاغذ دیواری") return [editorialVisuals.wallpaper, localVisuals.wallpaper, guideVisuals["wallpaper-guide"]];
  if (category === "طراحی داخلی") return [editorialVisuals.interiorDesign, localVisuals.interiorDesign, guideVisuals["interior-design-trends-2026"]];
  if (category === "خانه هوشمند") return [editorialVisuals.smartHome, localVisuals.smartHome, guideVisuals["smart-home-guide"], guideVisuals["smart-curtain-daylight-guide"]];
  return [editorialVisuals.interiorDesign, localVisuals.interiorDesign];
}

export function getGuideVisual(category: string, slug?: string): EditorialVisual {
  if (slug && guideVisuals[slug]) return guideVisuals[slug];
  const pool = fallbackGuidePool(category);
  if (!slug) return pool[0];
  return pool[stableIndex(slug, pool.length)];
}

export function getCategoryVisual(slug: string): EditorialVisual {
  if (slug === "curtain") return editorialVisuals.curtain;
  if (slug === "flooring") return editorialVisuals.flooring;
  if (slug === "carpet") return editorialVisuals.carpet;
  if (slug === "wallpaper") return editorialVisuals.wallpaper;
  if (slug === "smart-home") return editorialVisuals.smartHome;
  return editorialVisuals.interiorDesign;
}

export function getLocalVisual(slug: string): EditorialVisual {
  if (slug === "curtain") return localVisuals.curtain;
  if (slug === "flooring") return localVisuals.flooring;
  if (slug === "carpet") return localVisuals.carpet;
  if (slug === "wallpaper") return localVisuals.wallpaper;
  if (slug === "smart-home") return localVisuals.smartHome;
  return localVisuals.interiorDesign;
}
