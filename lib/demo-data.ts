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

export const businesses: Business[] = [
  {
    slug: "demo-curtain-baraghan",
    name: "پرده‌سرای برغان",
    category: "curtain",
    area: "خیابان برغان",
    city: "کرج",
    description: "نمونه پروفایل حرفه‌ای برای پرده، دوخت، اندازه‌گیری و نصب در خونه‌نما.",
    verified: false,
    featured: true,
    rating: 0,
    reviewCount: 0,
    services: ["پرده زبرا", "پرده شید", "پرده پارچه‌ای", "دوخت پرده", "نصب و تعمیر پرده"],
    media: [
      { url: "https://images.unsplash.com/photo-1598242822528-182185460969?auto=format&fit=crop&w=1600&q=82", alt: "پرده مدرن در فضای روشن", cover: true },
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=82", alt: "فضای داخلی گرم و مدرن" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82", alt: "نشیمن مدرن با نور طبیعی" },
      { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82", alt: "دکوراسیون روشن و مینیمال" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84", alt: "پرده‌های روشن در نشیمن معاصر" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84", alt: "فضای مسکونی روشن با پوشش پنجره مدرن" },
    ],
  },
  {
    slug: "demo-flooring-jahanshahr",
    name: "استودیو کف و چوب",
    category: "flooring",
    area: "جهانشهر",
    city: "کرج",
    description: "پارکت، لمینت، کفپوش و اجرای تخصصی با تمرکز بر زیرسازی و نصب دقیق.",
    verified: false,
    featured: false,
    rating: 0,
    reviewCount: 0,
    services: ["پارکت چوبی", "لمینت", "کفپوش PVC", "قرنیز", "نصب کفپوش"],
    media: [
      { url: "https://images.unsplash.com/photo-1780817612741-f8f3785d9908?auto=format&fit=crop&w=1600&q=82", alt: "کف چوبی در فضای داخلی", cover: true },
      { url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1400&q=82", alt: "فضای داخلی با کف گرم" },
      { url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=82", alt: "اتاق نشیمن با متریال چوب" },
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=82", alt: "ترکیب چوب و دکور مدرن" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84", alt: "کف چوبی روشن در فضای مینیمال" },
      { url: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1400&q=84", alt: "پارکت گرم در فضای نشیمن مدرن" },
    ],
  },
  {
    slug: "demo-carpet-mehrshahr",
    name: "خانه موکت مهرشهر",
    category: "carpet",
    area: "مهرشهر",
    city: "کرج",
    description: "موکت خانگی، اداری و تایلی همراه با اندازه‌گیری، زیرسازی و نصب.",
    verified: false,
    featured: false,
    rating: 0,
    reviewCount: 0,
    services: ["موکت رول", "موکت تایلی", "موکت اداری", "موکت اتاق کودک", "نصب موکت"],
    media: [
      { url: "https://images.unsplash.com/photo-1628745750110-c8ddcdad2c15?auto=format&fit=crop&w=1600&q=82", alt: "موکت و فرش در فضای نشیمن", cover: true },
      { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82", alt: "نشیمن روشن با بافت نرم" },
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=82", alt: "فضای مدرن با بافت گرم" },
      { url: "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1400&q=84", alt: "بافت نرم کف در اتاق نشیمن" },
      { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=84", alt: "فضای خانگی گرم با بافت کف" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84", alt: "نشیمن مدرن با فرش و بافت نرم" },
    ],
  },
  {
    slug: "demo-wallpaper-gohardasht",
    name: "خانه دیوار",
    category: "wallpaper",
    area: "گوهردشت",
    city: "کرج",
    description: "کاغذ دیواری، پوستر، دیوارپوش و اجرای حرفه‌ای با تمرکز بر زیرسازی تمیز.",
    verified: false,
    featured: false,
    rating: 0,
    reviewCount: 0,
    services: ["کاغذ دیواری", "پوستر دیواری", "دیوارپوش PVC", "ترمووال", "نصب کاغذ دیواری و دیوارپوش"],
    media: [
      { url: "https://images.unsplash.com/photo-1742799431910-985c27143e98?auto=format&fit=crop&w=1600&q=82", alt: "دیوارپوش و کاغذ دیواری مدرن", cover: true },
      { url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=82", alt: "دیوار شاخص در فضای مدرن" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82", alt: "فضای داخلی با دیوار مینیمال" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84", alt: "دیوار شاخص در نشیمن مدرن" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84", alt: "دیوار مینیمال با نور طبیعی" },
      { url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1400&q=84", alt: "ترکیب دیوار و نورپردازی داخلی" },
    ],
  },
  {
    slug: "demo-interior-azimieh",
    name: "استودیو طراحی عظیمیه",
    category: "interior-design",
    area: "عظیمیه",
    city: "کرج",
    description: "طراحی داخلی، بازسازی، نورپردازی و انتخاب متریال برای فضاهای مسکونی.",
    verified: false,
    featured: true,
    rating: 0,
    reviewCount: 0,
    services: ["طراحی داخلی", "طراحی سه‌بعدی", "نورپردازی داخلی", "بازسازی داخلی", "اجرا و نظارت پروژه"],
    media: [
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=82", alt: "طراحی داخلی گرم و معاصر", cover: true },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82", alt: "نشیمن مدرن و مینیمال" },
      { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82", alt: "فضای روشن با چیدمان مدرن" },
      { url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1400&q=82", alt: "طراحی داخلی با متریال طبیعی" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84", alt: "طراحی داخلی معاصر با نور طبیعی" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84", alt: "فضای مینیمال با متریال روشن" },
    ],
  },
  {
    slug: "demo-smart-home-jahanshahr",
    name: "خانه هوشمند جهانشهر",
    category: "smart-home",
    area: "جهانشهر",
    city: "کرج",
    description: "طراحی و اجرای خانه هوشمند، روشنایی، پرده برقی، قفل و کنترل سناریوهای روزمره.",
    verified: false,
    featured: true,
    rating: 0,
    reviewCount: 0,
    services: ["روشنایی هوشمند", "پرده برقی و موتور پرده", "قفل هوشمند", "سناریوهای خانه هوشمند", "کنترل از راه دور"],
    media: [
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=82", alt: "فضای مدرن مناسب سیستم خانه هوشمند", cover: true },
      { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82", alt: "خانه مدرن با نورپردازی یکپارچه" },
      { url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=82", alt: "نشیمن مدرن برای اتوماسیون خانگی" },
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=82", alt: "فضای داخلی با سناریوی روشنایی" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84", alt: "خانه مدرن مناسب اتوماسیون روشنایی" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84", alt: "فضای هوشمند با نورپردازی یکپارچه" },
    ],
  },
  {
    slug: "demo-lighting-gohardasht",
    name: "استودیو نور گوهردشت",
    category: "interior-design",
    area: "گوهردشت",
    city: "کرج",
    description: "طراحی نور، نور مخفی و هماهنگی روشنایی با دکوراسیون داخلی.",
    verified: false,
    featured: false,
    rating: 0,
    reviewCount: 0,
    services: ["نورپردازی داخلی", "طراحی داخلی", "کناف و سقف کاذب", "اجرا و نظارت پروژه"],
    media: [
      { url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1600&q=82", alt: "نورپردازی داخلی مدرن", cover: true },
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=82", alt: "نور گرم در فضای داخلی" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82", alt: "نورپردازی مینیمال در نشیمن" },
      { url: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1400&q=84", alt: "نورپردازی گرم در فضای مدرن" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84", alt: "نور مخفی در فضای مسکونی" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=84", alt: "سناریوی نور برای نشیمن مدرن" },
    ],
  },
  {
    slug: "demo-cabinet-mehrshahr",
    name: "کابینت و دکور مهرشهر",
    category: "interior-design",
    area: "مهرشهر",
    city: "کرج",
    description: "طراحی و اجرای کابینت آشپزخانه، کمد دیواری و مصنوعات MDF.",
    verified: false,
    featured: false,
    rating: 0,
    reviewCount: 0,
    services: ["کابینت آشپزخانه", "کمد دیواری", "مصنوعات MDF و چوبی", "طراحی سه‌بعدی"],
    media: [
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=82", alt: "آشپزخانه مدرن و مینیمال", cover: true },
      { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82", alt: "فضای داخلی با چوب و کابینت" },
      { url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=82", alt: "جزئیات دکور چوبی مدرن" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84", alt: "آشپزخانه روشن با کابینت مدرن" },
      { url: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1400&q=84", alt: "کابینت و جزئیات چوبی معاصر" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84", alt: "آشپزخانه مینیمال با نور طبیعی" },
    ],
  },
];

export function getBusiness(slug: string) {
  return businesses.find((business) => business.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
