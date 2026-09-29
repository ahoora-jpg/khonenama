import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "zebra-curtain-guide";
const title = "پرده زبرا چیست؟ | انواع، مزایا، معایب و راهنمای خرید";
const description = "پرده زبرا چیست و چه مدل‌هایی دارد؟ انواع زبرا، مزایا و معایب پرده زبرا، کنترل نور، کاربرد در پذیرایی و اتاق خواب، نصب و نکات مهم قبل از خرید را بررسی کنید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "پرده زبرا",
    "زبرا پرده",
    "پرده زبرا چیست",
    "انواع زبرا",
    "انواع پرده زبرا",
    "معایب پرده زبرا",
    "مزایا و معایب پرده زبرا",
    "پارچه زبرا چیست",
    "خرید پرده زبرا",
  ],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function ZebraCurtainGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
