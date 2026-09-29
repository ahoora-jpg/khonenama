import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "shade-curtain-guide";
const title = "پرده شید چیست؟ | انواع شید رول و نصب دیواری یا سقفی";
const description = "پرده شید چیست و شید رول چه کاربردی دارد؟ انواع شید برای پنجره، شید دیواری، شید اسکرین و بلک‌اوت و تفاوت نصب دیواری و سقفی را بررسی کنید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "پرده شید",
    "پرده شید چیست",
    "شید چیست",
    "شید رول چیست",
    "انواع شید",
    "انواع شید برای پنجره",
    "انواع پرده شید",
    "شید پنجره",
    "شید پشت پنجره",
    "شید دیواری",
    "شید رول",
    "شید بلک اوت",
    "شید اسکرین",
    "پرده شید یا زبرا",
  ],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function ShadeCurtainGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
