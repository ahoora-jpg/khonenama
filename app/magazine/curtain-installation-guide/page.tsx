import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "curtain-installation-guide";
const title = "نحوه نصب پرده زبرا سقفی و دیواری | اندازه‌گیری و اجرا";
const description = "نحوه نصب پرده زبرا سقفی و دیواری را مرحله‌به‌مرحله بررسی کنید؛ از اندازه‌گیری و انتخاب محل پایه تا نصب روی سقف یا دیوار، خطاهای رایج و نکات قبل از سوراخ‌کاری.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "نحوه نصب پرده زبرا سقفی",
    "طرز نصب پرده زبرا",
    "طریقه نصب پرده زبرا",
    "نصب زبرا دیواری",
    "نصب زبرا",
    "نصب پرده زبرا",
    "نصب پرده زبرا دیواری",
    "نصب پرده زبرا روی دیوار",
    "نصب پرده دیواری",
    "نصب پرده سقفی",
    "نصب پرده شید",
    "آموزش نصب پرده زبرا",
    "اندازه گیری پرده",
  ],
  authors: [{ name: "خونه نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function CurtainInstallationPage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
