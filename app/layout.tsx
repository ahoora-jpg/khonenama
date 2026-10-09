import type { Metadata } from "next";
import AdminContactFloat from "@/components/AdminContactFloat";
import "./globals.css";
import "./inner-pages.css";
import "@/components/home-refresh.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://khonenama.ir"),
  title: {
    default: "خونه نما | بازار تخصصی پرده و دکوراسیون",
    template: "%s | خونه نما؛ بازار تخصصی پرده و دکوراسیون",
  },
  description:
    "فروشگاه‌ها، متخصصان و خدمات پرده، موکت، کفپوش، کاغذ دیواری، طراحی داخلی و خانه هوشمند را در خونه نما پیدا و مقایسه کنید.",
  icons: {
    icon: [{ url: "/khonenama-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/khonenama-icon.png",
    apple: [{ url: "/khonenama-icon.png", sizes: "180x180" }],
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
    title: "خونه نما | بازار تخصصی پرده و دکوراسیون",
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
      <head><link rel="icon" href="/favicon.ico?v=2" sizes="any"/><link rel="icon" type="image/png" href="/khonenama-icon.png?v=2"/><link rel="apple-touch-icon" href="/khonenama-icon.png?v=2"/></head>
      <body>{children}<AdminContactFloat /></body>
    </html>
  );
}
