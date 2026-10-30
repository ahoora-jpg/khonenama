import type { Metadata } from "next";
import RegistrationFunnelReport from "@/components/RegistrationFunnelReport";

export const metadata: Metadata = { title: "گزارش ثبت‌نام | مدیریت خونه‌نما", robots: { index: false, follow: false } };

export default function RegistrationFunnelPage() {
  return <RegistrationFunnelReport />;
}
