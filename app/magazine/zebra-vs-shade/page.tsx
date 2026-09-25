import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "zebra-vs-shade";
const title = "تفاوت پرده شید و زبرا | کدام برای خانه بهتر است؟";
const description = "تفاوت پرده شید و زبرا را از نظر کنترل نور، حریم خصوصی، نظافت، اتاق خواب، آشپزخانه و پذیرایی مقایسه کنید و انتخاب مناسب‌تری داشته باشید.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "تفاوت شید و زبرا",
    "تفاوت پرده شید و زبرا",
    "پرده زبرا یا شید",
    "زبرا بهتر است یا شید",
    "پرده شید چیست",
    "پرده زبرا چیست",
  ],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function ZebraVsShadePage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
