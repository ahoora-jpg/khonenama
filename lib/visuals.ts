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
};

export function getGuideVisual(category: string, slug?: string): EditorialVisual {
  if (slug && guideVisuals[slug]) return guideVisuals[slug];
  if (category === "پرده") return editorialVisuals.curtain;
  if (category === "کفپوش") return editorialVisuals.flooring;
  if (category === "موکت") return editorialVisuals.carpet;
  if (category === "کاغذ دیواری") return editorialVisuals.wallpaper;
  if (category === "طراحی داخلی") return editorialVisuals.interiorDesign;
  if (category === "خانه هوشمند") return editorialVisuals.smartHome;
  return editorialVisuals.interiorDesign;
}

export function getCategoryVisual(slug: string): EditorialVisual {
  if (slug === "curtain") return editorialVisuals.curtain;
  if (slug === "flooring") return editorialVisuals.flooring;
  if (slug === "carpet") return editorialVisuals.carpet;
  if (slug === "wallpaper") return editorialVisuals.wallpaper;
  if (slug === "smart-home") return editorialVisuals.smartHome;
  return editorialVisuals.interiorDesign;
}
