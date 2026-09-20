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
      "نمایش عادی در دسته و محدوده فعالیت",
      "اطلاعات تماس و شبکه‌های اجتماعی",
      "لینک اختصاصی قابل اشتراک",
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
      "نشان «حرفه‌ای» روی پروفایل و لیست‌ها",
      "تا ۲۰ تصویر نمونه‌کار",
      "آمار بازدید، کلیک تماس و ورودی‌ها",
      "پاسخ به نظرها و مدیریت بهتر درخواست‌ها",
      "امکان خرید Boost و تبلیغات هدفمند",
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
      "نشان «ویژه» و ظاهر متمایز پروفایل",
      "اولویت نمایش در نتایج با برچسب شفاف",
      "تا ۴۰ تصویر نمونه‌کار",
      "اولویت در کمپین‌ها و صفحات محلی",
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
