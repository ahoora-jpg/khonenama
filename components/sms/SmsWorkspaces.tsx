"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ContactsPage, GroupsPage } from './SmsContacts';
import { ProspectsPage, AcquisitionPage } from './SmsAcquisition';
import { SendPage, HistoryPage } from './SmsMessages';
import { TemplatesPage } from './SmsCampaignWorkspace';
import { GatewayPage, SettingsPage } from './SmsOverview';

function Tabs({ base, tabs, value }: { base: string; tabs: string[][]; value: string }) {
  return <nav className="sms-workspace-tabs" aria-label="بخش‌های صفحه">{tabs.map(([key, title]) => <Link key={key} aria-current={value === key ? 'page' : undefined} className={value === key ? 'is-active' : ''} href={base + '?tab=' + key}>{title}</Link>)}</nav>;
}
export function ContactsWorkspace({ initial = 'all' }: { initial?: string }) {
  const tab = useSearchParams().get('tab') || initial;
  return <><Tabs base="/sms/contacts" value={tab} tabs={[["all", "همه مخاطبان"], ["groups", "گروه‌ها"], ["prospects", "بدون غرفه"]]} />
    {tab === 'groups' ? <GroupsPage /> : tab === 'prospects' ? <ProspectsPage /> : <ContactsPage />}</>;
}
export function MessagesWorkspace({ initial = 'send' }: { initial?: string }) {
  const params = useSearchParams(), tab = params.get('tab') || initial;
  return <><Tabs base="/sms/messages" value={tab} tabs={[["send", "ارسال پیام"], ["history", "در صف و تاریخچه"], ["failed", "ناموفق‌ها"], ["inbox", "دریافتی‌ها"], ["templates", "قالب‌ها"]]} />
    {tab === 'history' ? <HistoryPage key={'history' + params.get('status')} /> : tab === 'failed' ? <HistoryPage key="failed" failed /> : tab === 'inbox' ? <HistoryPage key="inbox" inbound /> : tab === 'templates' ? <TemplatesPage /> : <SendPage />}</>;
}
export function ConnectionWorkspace() {
  return <><GatewayPage /><details className="sms-panel"><summary>جزئیات فنی و تنظیمات دسترسی</summary><SettingsPage /></details></>;
}
export function PerformanceWorkspace() {
  return <><p>عملکرد، کلیک‌ها و تبدیل‌های کمپین انتخاب‌شده</p><AcquisitionPage /></>;
}
