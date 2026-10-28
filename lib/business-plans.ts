export const LEGACY_PROMOTION_QR_END_AT = "2027-02-04T20:30:00Z";
export const LAUNCH_FREE_END_AT = "2027-02-04T20:30:00Z";
export const LAUNCH_DISCOUNT_END_AT = LAUNCH_FREE_END_AT;
// افزونهٔ ظرفیت نمایش داده می‌شود، اما تا اطلاع بعدی فعال نیست.
export const CUSTOM_CAPACITY_AVAILABLE_AT = null;
export function launchFreeActive(now = Date.now()) { return now < Date.parse(LAUNCH_FREE_END_AT); }
export function launchDiscountActive(now = Date.now()) { return launchFreeActive(now); }
export function discountedMonthlyPrice(code: string, normal: number | null, now = Date.now()) {
  if (normal === null || !launchFreeActive(now)) return normal;
  return code === "pro" || code === "premium" ? 0 : normal;
}
export function customCapacityAvailable() { return false; }

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
    priceLabel: "۱۵۰ هزار تومان برای ۳۰ روز",
    amountToman: 150000,
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
    priceLabel: "۲۵۰ هزار تومان برای ۳۰ روز",
    amountToman: 250000,
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
