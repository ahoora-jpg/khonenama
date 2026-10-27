import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/sms-assets/icon.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/sms-assets/icon.png",
    apple: [{ url: "/sms-assets/apple-icon.png", sizes: "180x180" }],
  },
};
export default function SmsLayout({ children }: { children: ReactNode }) { return children; }
