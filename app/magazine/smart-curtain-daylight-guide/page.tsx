import type { Metadata } from "next";
import GuidePage from "../[slug]/page";

const slug = "smart-curtain-daylight-guide";
const title = "پرده برقی و نور طبیعی | طراحی سناریوی هوشمند";
const description = "راهنمای طراحی سناریوی پرده برقی بر اساس جهت پنجره، شدت نور، خیرگی، حریم خصوصی و هماهنگی با روشنایی هوشمند خانه.";
const url = `https://khonenama.ir/magazine/${slug}`;

export const metadata: Metadata = {
  title,
  description,
  keywords: ["پرده برقی", "پرده هوشمند", "سناریو پرده برقی", "کنترل نور طبیعی", "موتور پرده هوشمند"],
  authors: [{ name: "خونه‌نما", url: "https://khonenama.ir/about" }],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", locale: "fa_IR" },
  twitter: { card: "summary", title, description },
};

export default function SmartCurtainDaylightPage() {
  return GuidePage({ params: Promise.resolve({ slug }) });
}
