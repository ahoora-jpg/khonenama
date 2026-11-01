import { CommandDashboard } from './SmsCommandCenter';
import {ContactsWorkspace,MessagesWorkspace,ConnectionWorkspace,PerformanceWorkspace} from './SmsWorkspaces';
import { Suspense } from "react";
import { SmsAdminShell, LoadingSkeleton } from "./SmsAdminShell";
import {
  ReportsPage,
} from "./SmsOverview";
import { CampaignsPage } from "./SmsCampaignWorkspace";
import type { SmsPageKey } from "@/lib/sms-admin-ui";
const pages = {
  messages:MessagesWorkspace,
  acquisition:PerformanceWorkspace,
  prospects:()=> <ContactsWorkspace initial="prospects"/>,
  dashboard: CommandDashboard,
  send: ()=> <MessagesWorkspace initial="send"/>,
  contacts: ContactsWorkspace,
  groups: ()=> <ContactsWorkspace initial="groups"/>,
  campaigns: CampaignsPage,
  templates: ()=> <MessagesWorkspace initial="templates"/>,
  inbox: ()=> <MessagesWorkspace initial="inbox"/>,
  history: ()=> <MessagesWorkspace initial="history"/>,
  reports: ReportsPage,
  gateway: ConnectionWorkspace,
  settings: ConnectionWorkspace,
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
