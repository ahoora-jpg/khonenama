export const editorialVisuals = {
  curtain: {
    src: "https://images.unsplash.com/photo-1598242822528-182185460969?auto=format&fit=crop&w=1600&q=82",
    alt: "پرده و شید در فضای داخلی روشن و مدرن",
  },
  flooring: {
    src: "https://images.unsplash.com/photo-1780817612741-f8f3785d9908?auto=format&fit=crop&w=1600&q=82",
    alt: "کف چوبی و پارکت در فضای داخلی با نور طبیعی",
  },
  carpet: {
    src: "https://images.unsplash.com/photo-1628745750110-c8ddcdad2c15?auto=format&fit=crop&w=1600&q=82",
    alt: "موکت و فرش روشن در فضای نشیمن مدرن",
  },
  wallpaper: {
    src: "https://images.unsplash.com/photo-1742799431910-985c27143e98?auto=format&fit=crop&w=1600&q=82",
    alt: "کاغذ دیواری طرح‌دار در فضای داخلی",
  },
  interiorDesign: {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=82",
    alt: "طراحی داخلی گرم و مدرن خانه",
  },
} as const;

export function getGuideVisual(category: string) {
  if (category === "پرده") return editorialVisuals.curtain;
  if (category === "کفپوش") return editorialVisuals.flooring;
  if (category === "موکت") return editorialVisuals.carpet;
  if (category === "کاغذ دیواری") return editorialVisuals.wallpaper;
  if (category === "طراحی داخلی") return editorialVisuals.interiorDesign;
  return editorialVisuals.interiorDesign;
}

export function getCategoryVisual(slug: string) {
  if (slug === "curtain") return editorialVisuals.curtain;
  if (slug === "flooring") return editorialVisuals.flooring;
  if (slug === "carpet") return editorialVisuals.carpet;
  if (slug === "wallpaper") return editorialVisuals.wallpaper;
  return editorialVisuals.interiorDesign;
}
