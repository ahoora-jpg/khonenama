import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "curtain-installation-guide";
const title = "نصب پرده دیواری و سقفی | راهنمای زبرا و شید";
const description = "راهنمای نصب پرده زبرا و شید روی دیوار یا سقف؛ انتخاب محل نصب، اندازه‌گیری و نکات مهم قبل از سوراخ‌کاری و سفارش پرده.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: ["نصب پرده دیواری", "نصب پرده سقفی", "نصب پرده زبرا", "نصب پرده شید", "اندازه گیری پرده"],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function CurtainInstallationPage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
