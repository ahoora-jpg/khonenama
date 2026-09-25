import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "flooring-karaj-guide";
const title = "پارکت و لمینت کرج | خرید، نصب و زیرسازی";
const description = "راهنمای خرید و نصب پارکت و لمینت در کرج؛ انتخاب فروشگاه و نصاب، زیرسازی، فوم، قرنیز، پرت و عوامل مؤثر بر هزینه نهایی کفپوش.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "پارکت لمینت کرج",
    "پارکت کرج",
    "لمینت کرج",
    "نصب پارکت در کرج",
    "نصب پارکت و لمینت در کرج",
    "نصاب پارکت کرج",
    "کفپوش کرج",
    "کفپوش PVC کرج",
  ],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary_large_image", title, description },
};

export default function FlooringKarajGuidePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
