export const businessPlans = [
  {
    code: "free",
    name: "پایه",
    priceLabel: "رایگان",
    amountToman: 0,
    description: "برای شروع حضور کسب‌وکار در خونه‌نما",
    badge: "شروع سریع",
    features: [
      "پروفایل عمومی و قابل ایندکس",
      "نمایش در دسته و محدوده فعالیت",
      "اطلاعات تماس و شبکه‌های اجتماعی",
      "تا ۶ تصویر نمونه‌کار",
    ],
    purchasable: true,
  },
  {
    code: "pro",
    name: "حرفه‌ای",
    priceLabel: "قیمت هنگام فعال‌سازی",
    amountToman: null,
    description: "برای کسب‌وکارهایی که می‌خواهند مشتری بیشتری جذب کنند",
    badge: "پیشنهادی",
    features: [
      "همه امکانات پلن پایه",
      "گالری و خدمات گسترده‌تر",
      "آمار بازدید و کلیک تماس",
      "پاسخ به نظرها و درخواست‌ها",
      "امکان Boost و تبلیغات هدفمند",
    ],
    purchasable: false,
  },
  {
    code: "premium",
    name: "ویژه",
    priceLabel: "قیمت هنگام فعال‌سازی",
    amountToman: null,
    description: "برای حضور پررنگ‌تر در دسته و شهر",
    badge: "بیشترین دیده‌شدن",
    features: [
      "همه امکانات حرفه‌ای",
      "جایگاه‌های ویژه با برچسب شفاف",
      "اولویت در کمپین‌های محلی",
      "گزارش عملکرد پیشرفته",
      "پشتیبانی اولویت‌دار",
    ],
    purchasable: false,
  },
] as const;

export type BusinessPlanCode = (typeof businessPlans)[number]["code"];

export function getBusinessPlan(code: string) {
  return businessPlans.find((plan) => plan.code === code);
}
