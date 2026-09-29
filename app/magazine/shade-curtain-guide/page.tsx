import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "shade-curtain-guide";
const title = "پرده شید | انواع شید، شید رول و نصب دیواری یا سقفی";
const description = "پرده شید و شید رول را از نظر انواع ساده، اسکرین و بلک‌اوت، کاربرد برای پنجره و تفاوت نصب دیواری و سقفی بررسی کنید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: ["پرده شید", "پرده شید چیست", "انواع پرده شید", "شید رول", "شید بلک اوت", "شید اسکرین", "پرده شید یا زبرا"],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function ShadeCurtainGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
