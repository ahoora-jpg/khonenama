import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "smart-home-without-internet-guide";
const title = "با قطع اینترنت خانه هوشمند چه اتفاقی می‌افتد؟ | کنترل آفلاین";
const description = "اگر اینترنت قطع شود خانه هوشمند چه می‌شود؟ تفاوت کنترل محلی و ابری، عملکرد کلیدها، سنسورها، روشنایی، پرده و سناریوها را در حالت آفلاین بررسی کنید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "با قطع اینترنت خانه هوشمند چه اتفاقی می افتد",
    "خانه هوشمند بدون اینترنت",
    "کنترل آفلاین خانه هوشمند",
    "خانه هوشمند بدون وای فای",
    "کنترل محلی خانه هوشمند",
    "خانه هوشمند آفلاین",
  ],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function SmartHomeWithoutInternetPage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
