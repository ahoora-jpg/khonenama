import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "zebra-curtain-guide";
const title = "پرده زبرا | انواع، مزایا، معایب و راهنمای خرید";
const description = "پرده زبرا را از نظر انواع، مزایا و معایب، کنترل نور، کاربرد در پذیرایی و اتاق خواب، نصب و نکات مهم قبل از خرید بررسی کنید.";
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
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function ZebraCurtainGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
