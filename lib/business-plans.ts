export const LEGACY_PROMOTION_QR_END_AT = "2026-11-21T20:30:00Z";
export const CUSTOM_CAPACITY_AVAILABLE_AT = "2026-11-21T20:30:00Z";
export function customCapacityAvailable(now = Date.now()) { return now >= Date.parse(CUSTOM_CAPACITY_AVAILABLE_AT); }

export const businessPlans = [
  {
    code: "free",
    name: "پایه",
    priceLabel: "رایگان",
    amountToman: 0,
    description: "برای شروع حضور کسب‌وکار در خونه نما",
    badge: "شروع سریع",
    features: [
      "پروفایل عمومی و قابل ایندکس",
      "نمایش عادی در دسته و محدوده فعالیت",
      "اطلاعات تماس و شبکه‌های اجتماعی",
      "لینک اختصاصی قابل اشتراک",
      "۱۰ عکس نمونه‌کار، جدا از تصویر اصلی و پروفایل",
      "گالری سادهٔ نمونه‌کارها",
    ],
    purchasable: true,
  },
  {
    code: "pro",
    name: "حرفه‌ای",
    priceLabel: "۲۵۰ هزار تومان برای ۳۰ روز",
    amountToman: 250000,
    description: "برای کسب‌وکارهایی که می‌خواهند مشتری بیشتری جذب کنند",
    badge: "پیشنهادی",
    features: [
      "همه امکانات پلن پایه",
      "نشان «حرفه‌ای» روی پروفایل و لیست‌ها",
      "تا ۳۰ تصویر نمونه‌کار",
      "۲ ویدیو، هرکدام حداکثر ۲۰ ثانیه و ۱۵ مگابایت",
      "دسته‌بندی نمونه‌کارها با توضیحات اختصاصی پروژه‌ها",
      "آمار بازدید، کلیک تماس و ورودی‌ها",
      "پاسخ به نظرها و مدیریت بهتر درخواست‌ها",
    ],
    purchasable: false,
  },
  {
    code: "premium",
    name: "ویژه",
    priceLabel: "۳۵۰ هزار تومان برای ۳۰ روز",
    amountToman: 350000,
    description: "برای معرفی کامل‌تر و گزارش عملکرد پیشرفته",
    badge: "ظرفیت بیشتر نمونه‌کار",
    features: [
      "همه امکانات حرفه‌ای",
      "نشان «ویژه» و ظاهر متمایز پروفایل",
      "تا ۷۰ تصویر نمونه‌کار",
      "۵ ویدیو، هرکدام حداکثر ۲۰ ثانیه و ۱۵ مگابایت",
      "دسته‌بندی نمونه‌کارها با توضیحات اختصاصی پروژه‌ها",
      "آمار پیشنهادها و زمان پاسخ اولیه",
      "پشتیبانی اولویت‌دار",
    ],
    purchasable: false,
  },
] as const;

export type BusinessPlanCode = (typeof businessPlans)[number]["code"];

export function getBusinessPlan(code: string) {
  return businessPlans.find((plan) => plan.code === code);
}
