import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "wallpaper-karaj-guide";
const title = "محاسبه رول و نصب کاغذ دیواری | زیرسازی و نصاب در کرج";
const description = "راهنمای محاسبه تعداد رول، Pattern Repeat، زیرسازی و نصب کاغذ دیواری؛ نکات انتخاب نصاب و عوامل مؤثر بر هزینه اجرای پروژه در کرج.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "نصب کاغذ دیواری کرج",
    "نصاب کاغذ دیواری کرج",
    "فروشگاه کاغذ دیواری کرج",
    "محاسبه رول کاغذ دیواری",
    "زیرسازی کاغذ دیواری",
  ],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function WallpaperKarajGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
