import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "shade-curtain-guide";
const title = "پرده شید چیست؟ انواع شید و کاربرد هر مدل";
const description = "شید رول چیست و چه تفاوتی با زبرا دارد؟ شید ساده، اسکرین و بلک‌اوت را از نظر نور، حریم خصوصی، نصب و کاربرد مقایسه کنید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: ["پرده شید چیست", "انواع پرده شید", "شید رول", "شید بلک اوت", "شید اسکرین", "پرده شید یا زبرا"],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function ShadeCurtainGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
