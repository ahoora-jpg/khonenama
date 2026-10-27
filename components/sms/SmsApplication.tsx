import { Suspense } from "react";
import { SmsAdminShell, LoadingSkeleton } from "./SmsAdminShell";
import {
  DashboardPage,
  GatewayPage,
  ReportsPage,
  SettingsPage,
} from "./SmsOverview";
import { SendPage, HistoryPage } from "./SmsMessages";
import { ContactsPage, GroupsPage } from "./SmsContacts";
import { CampaignsPage, TemplatesPage } from "./SmsCampaignWorkspace";
import type { SmsPageKey } from "@/lib/sms-admin-ui";
const pages = {
  dashboard: DashboardPage,
  send: SendPage,
  contacts: ContactsPage,
  groups: GroupsPage,
  campaigns: CampaignsPage,
  templates: TemplatesPage,
  inbox: () => <HistoryPage inbound />,
  history: HistoryPage,
  reports: ReportsPage,
  gateway: GatewayPage,
  settings: SettingsPage,
};
export default function SmsApplication({ page }: { page: SmsPageKey }) {
  const Page = pages[page];
  return (
    <SmsAdminShell page={page}>
      <Suspense fallback={<LoadingSkeleton />}>
        <Page />
      </Suspense>
    </SmsAdminShell>
  );
}
