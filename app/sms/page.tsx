import type { Metadata } from "next";
import SmsCenter from "@/components/SmsCenter";
import SmsCampaigns from "@/components/SmsCampaigns";
import SmsTemplates from "@/components/SmsTemplates";

export const metadata: Metadata = { title: "مرکز پیامک خونه‌نما", robots: { index: false, follow: false } };

export default function SmsPage() {
  return <main dir="rtl" className="shell">
    <header style={{ paddingBlock: 24, borderBottom: "1px solid #ddd" }}><strong>خونه‌نما · مرکز پیامک</strong></header>
    <SmsCenter /><SmsCampaigns /><SmsTemplates />
  </main>;
}
