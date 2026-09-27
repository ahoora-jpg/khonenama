import type { Metadata } from "next";
import AdminContactFloat from "@/components/AdminContactFloat";
import "./globals.css";
import "./inner-pages.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://khonenama.ir"),
  title: {
    default: "خونه نما | دکوراسیون داخلی و فضای داخلی خانه",
    template: "%s | خونه نما",
  },
  description:
    "فروشگاه‌ها، متخصصان و خدمات پرده، موکت، کفپوش، کاغذ دیواری، طراحی داخلی و خانه هوشمند را در خونه نما پیدا و مقایسه کنید.",
  icons: {
    icon: "/khonenama-logo.svg",
    shortcut: "/khonenama-logo.svg",
    apple: "/khonenama-logo.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "خونه نما | دکوراسیون داخلی و فضای داخلی خانه",
    description:
      "خونه نما مرجع پیدا کردن و مقایسه فروشگاه‌ها و متخصصان دکوراسیون و فضای داخلی خانه است.",
    siteName: "خونه نما",
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
