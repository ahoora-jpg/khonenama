import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "wallpaper-karaj-guide";
const title = "راهنمای کاغذ دیواری کرج | رول، زیرسازی و انتخاب نصاب";
const description = "راهنمای خرید و نصب کاغذ دیواری در کرج؛ محاسبه تعداد رول، Pattern Repeat، زیرسازی، انتخاب فروشگاه و نصاب و عوامل مؤثر بر هزینه اجرا.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "کاغذ دیواری کرج",
    "کاغذ دیواری در کرج",
    "نصب کاغذ دیواری کرج",
    "نصاب کاغذ دیواری کرج",
    "فروشگاه کاغذ دیواری کرج",
    "محاسبه رول کاغذ دیواری",
    "زیرسازی کاغذ دیواری",
  ],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function WallpaperKarajGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
