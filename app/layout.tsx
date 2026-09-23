import type { Metadata } from "next";
import AdminContactFloat from "@/components/AdminContactFloat";
import "./globals.css";
import "./inner-pages.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://khonenama.ir"),
  title: {
    default: "خونه‌نما | مرجع دکوراسیون و خدمات منزل",
    template: "%s | خونه‌نما",
  },
  description:
    "فروشگاه‌ها، متخصصان و خدمات پرده، موکت، کفپوش، کاغذ دیواری و دکوراسیون داخلی را در خونه‌نما پیدا و مقایسه کنید.",
  openGraph: {
    title: "خونه‌نما | مرجع دکوراسیون و خدمات منزل",
    description:
      "فروشگاه‌ها و متخصصان دکوراسیون منزل را پیدا، مقایسه و انتخاب کنید.",
    siteName: "خونه‌نما",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}<AdminContactFloat /></body>
    </html>
  );
}
