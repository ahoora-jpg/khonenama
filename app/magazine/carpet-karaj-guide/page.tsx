import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "carpet-karaj-guide";
const title = "موکت کرج | خرید، متراژ و نصب";
const description = "راهنمای خرید و نصب موکت در کرج؛ انتخاب فروشگاه، موکت رول یا تایلی، محاسبه متراژ و پرت، زیرسازی و عوامل مؤثر بر هزینه اجرا.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "موکت کرج",
    "فروشگاه موکت کرج",
    "خرید موکت کرج",
    "نصب موکت در کرج",
    "موکت تایلی کرج",
    "موکت رول کرج",
    "محاسبه متراژ موکت",
  ],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function CarpetKarajGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
