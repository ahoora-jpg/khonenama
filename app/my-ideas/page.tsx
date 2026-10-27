import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SavedIdeas from "@/components/SavedIdeas";

export const metadata: Metadata = {
  title: "ایده‌های من | خونه نما",
  description: "ایده‌های ذخیره‌شده دکوراسیون را برای پروژه خود مرتب کنید و با متخصص مرتبط در میان بگذارید.",
  robots: { index: false, follow: true },
};

export default function MyIdeasPage() {
  return <main><Header /><div className="shell inner-page"><SavedIdeas /></div><Footer /></main>;
}
