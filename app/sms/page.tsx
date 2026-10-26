import type { Metadata } from "next";
import SmsCenter from "@/components/SmsCenter";
import SmsCampaigns from "@/components/SmsCampaigns";
import SmsTemplates from "@/components/SmsTemplates";
import "./sms.css";

export const metadata: Metadata = { title: "مرکز پیامک خونه‌نما", robots: { index: false, follow: false } };

export default function SmsPage() {
  return <main dir="rtl" className="shell sms-workspace">
    <header style={{ paddingBlock: 24, borderBottom: "1px solid #ddd" }}><strong>خونه‌نما · مرکز پیامک</strong></header>
    <nav aria-label="بخش‌های مرکز پیامک" className="sms-nav"><a href="#sms-overview">نمای کلی</a><a href="#sms-messages">پیش‌نویس پیام</a><a href="#sms-campaigns">گروه‌ها و کمپین‌ها</a><a href="#sms-templates">قالب‌ها</a><a href="#sms-settings">وضعیت اتصال</a></nav>
    <SmsCenter /><SmsCampaigns /><SmsTemplates />
  </main>;
}
