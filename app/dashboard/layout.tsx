import type { Metadata } from "next";
import type { ReactNode } from "react";
import SubscriptionExpiryNotice from "@/components/SubscriptionExpiryNotice";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <><SubscriptionExpiryNotice />{children}</>;
}
