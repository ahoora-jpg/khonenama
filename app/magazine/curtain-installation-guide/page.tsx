import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "curtain-installation-guide";
const title = "نصب پرده زبرا دیواری و سقفی | آموزش اندازه‌گیری";
const description = "آموزش نصب پرده زبرا و شید روی دیوار یا سقف؛ از اندازه‌گیری و انتخاب محل پایه تا نکات مهم قبل از سوراخ‌کاری و سفارش پرده.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "نصب زبرا دیواری",
    "نصب زبرا",
    "نصب پرده زبرا",
    "نصب پرده زبرا روی دیوار",
    "نصب پرده دیواری",
    "نصب پرده سقفی",
    "نصب پرده شید",
    "آموزش نصب پرده زبرا",
    "اندازه گیری پرده",
  ],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function CurtainInstallationPage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
