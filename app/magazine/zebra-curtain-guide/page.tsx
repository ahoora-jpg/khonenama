import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "zebra-curtain-guide";
const title = "پرده زبرا چیست؟ مزایا، معایب و انواع پرده زبرا";
const description = "پرده زبرا چیست و چه مزایا و معایبی دارد؟ انواع زبرا، کنترل نور، کاربرد در پذیرایی و اتاق خواب و نکات مهم قبل از خرید را مقایسه کنید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "پرده زبرا",
    "زبرا پرده",
    "پرده زبرا چیست",
    "معایب پرده زبرا",
    "مزایا و معایب پرده زبرا",
    "انواع پرده زبرا",
    "خرید پرده زبرا",
  ],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function ZebraCurtainGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
