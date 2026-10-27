export const smsPages = [
  {
    key: "dashboard",
    path: "/sms",
    title: "داشبورد",
    description: "خلاصهٔ واقعی فعالیت مرکز پیامک",
  },
  {
    key: "send",
    path: "/sms/send",
    title: "ارسال پیامک",
    description: "نگارش پیام و بررسی مخاطب پیش از ثبت",
  },
  {
    key: "contacts",
    path: "/sms/contacts",
    title: "مخاطبان",
    description: "مدیریت مخاطبان و رضایت مستند",
  },
  {
    key: "groups",
    path: "/sms/groups",
    title: "گروه‌های مخاطبان",
    description: "سازمان‌دهی مخاطبان؛ عضویت در گروه مجوز تبلیغ نیست",
  },
  {
    key: "campaigns",
    path: "/sms/campaigns",
    title: "کمپین‌ها",
    description: "ساخت و بازبینی کمپین‌های تبلیغاتی",
  },
  {
    key: "templates",
    path: "/sms/templates",
    title: "قالب پیام‌ها",
    description: "مدیریت متن پیام‌های تکرارشونده",
  },
  {
    key: "inbox",
    path: "/sms/inbox",
    title: "پیام‌های دریافتی",
    description: "پاسخ‌های ثبت‌شده از گوشی",
  },
  {
    key: "history",
    path: "/sms/history",
    title: "صف و تاریخچه ارسال",
    description: "پیگیری وضعیت واقعی و رویدادهای هر پیام",
  },
  {
    key: "reports",
    path: "/sms/reports",
    title: "گزارش‌ها",
    description: "آمار ثبت‌شده در بازهٔ انتخابی",
  },
  {
    key: "gateway",
    path: "/sms/gateway",
    title: "اتصال گوشی",
    description: "وضعیت درگاه اندروید و عامل ویندوز",
  },
  {
    key: "settings",
    path: "/sms/settings",
    title: "تنظیمات",
    description: "دسترسی، محدودیت‌ها و نگهداری داده",
  },
] as const;
export type SmsPageKey = (typeof smsPages)[number]["key"];
export const stateLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  queued: "در صف",
  leased: "در اختیار عامل",
  submitted: "پذیرفته‌شده توسط گوشی",
  processed: "پردازش‌شده",
  sent: "ارسال‌شده",
  delivered: "تحویل‌شده",
  failed: "ناموفق",
  unknown: "نامشخص",
  cancelled: "لغوشده",
  approved: "تأییدشده",
  running: "در حال ثبت",
  paused: "متوقف",
  completed: "پایان‌یافته",
};
export const kindLabels: Record<string, string> = {
  other: "سایر",
  customer: "مشتری",
  seller: "غرفه‌دار",
  admin: "مدیر",
};
export const faNumber = (value: number) => value.toLocaleString("fa-IR");
export function smsDate(value?: string | null) {
  if (!value) return "ثبت نشده";
  const date = new Date(
    /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value.replace(" ", "T") + "Z",
  );
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("fa-IR", {
        timeZone: "Asia/Tehran",
        dateStyle: "short",
        timeStyle: "short",
      })
    : "نامشخص";
}
export function bridgeState(
  agent: {
    enabled: number;
    gateway_enabled: number;
    last_seen_at: string | null;
  } | null,
  now = Date.now(),
) {
  if (!agent) return "unknown";
  if (!agent.enabled || !agent.gateway_enabled) return "disabled";
  if (!agent.last_seen_at) return "unknown";
  const seen = Date.parse(
    /(?:Z|[+-]\d\d:\d\d)$/.test(agent.last_seen_at)
      ? agent.last_seen_at
      : agent.last_seen_at.replace(" ", "T") + "Z",
  );
  return Number.isFinite(seen) && now - seen >= 0 && now - seen < 120000
    ? "online"
    : "offline";
}
export const bridgeLabels = {
  unknown: "وضعیت نامشخص",
  disabled: "غیرفعال",
  online: "ارتباط اخیر عامل",
  offline: "ارتباط عامل منقضی شده",
};
