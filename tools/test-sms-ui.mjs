import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url),
  cache = new Map();
const root = new URL("../", import.meta.url);
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(readFileSync(new URL(file, root), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const imports = (name) => {
    if (name === "next/link")
      return {
        __esModule: true,
        default: ({ children, ...props }) =>
          React.createElement("a", props, children),
      };
    if (name === "next/navigation")
      return { useSearchParams: () => new URLSearchParams() };
    if (name === "@/lib/sms-admin-ui") return load("lib/sms-admin-ui.ts");
    if (name === "@/lib/sms-text") return load("lib/sms-text.ts");
    if (name === "./SmsAdminShell")
      return load("components/sms/SmsAdminShell.tsx");
    return require(name);
  };
  vm.runInNewContext(code, {
    exports,
    require: imports,
    console,
    URL,
    URLSearchParams,
    Date,
    setTimeout,
    clearTimeout,
    crypto: globalThis.crypto,
  });
  return exports;
}
const shell = load("components/sms/SmsAdminShell.tsx");
const empty = {
  counts: [],
  contacts: [],
  messages: [],
  campaigns: [],
  agent: null,
  summary: {
    consented_contacts: 0,
    opt_outs: 0,
    priority_queued: 0,
    active_campaigns: 0,
  },
  liveSendingEnabled: false,
  setup: { separateKeyConfigured: false, bridgeCredentialConfigured: false },
};
function render(Component, data = empty) {
  return renderToStaticMarkup(
    React.createElement(
      shell.SmsAdminContext.Provider,
      {
        value: { data, revision: 0, refresh: async () => {}, notify: () => {} },
      },
      React.createElement(Component),
    ),
  );
}
test("dashboard renders a real overview and all navigation links without any editing forms", () => {
  const { DashboardPage } = load("components/sms/SmsOverview.tsx");
  const html = render(DashboardPage);
  assert.equal((html.match(/class="sms-stat"/g) || []).length, 6);
  assert.ok(!html.includes("<form"));
  assert.ok(html.includes("هنوز کمپینی ندارید"));
  assert.ok(!html.includes("12 480"));
  assert.ok(!html.includes("98.4"));
  for (const path of [
    "/sms/send",
    "/sms/contacts?new=1",
    "/sms/campaigns?new=1",
    "/sms/history?status=queued",
  ])
    assert.ok(html.includes(path));
  const markup = renderToStaticMarkup(
    React.createElement(shell.SmsAdminShell, {
      page: "dashboard",
      children: null,
    }),
  );
  for (const page of load("lib/sms-admin-ui.ts").smsPages)
    assert.ok(markup.includes('href="' + page.path + '"'));
  assert.ok(markup.includes('aria-current="page"'));
  assert.ok(markup.includes("بازکردن فهرست"));
  assert.ok(markup.includes('dir="rtl"'));
});
test("message form saves a draft while live sending is disabled and keeps a consent warning", () => {
  const { SendPage } = load("components/sms/SmsMessages.tsx");
  const html = render(SendPage);
  assert.ok(html.includes("ذخیره پیش‌نویس"));
  assert.ok(!html.includes("ثبت در صف ارسال"));
  assert.ok(html.includes("برآورد هزینه در دسترس نیست"));
  assert.ok(html.includes("دلیل ارسال عملیاتی"));
});
test("all dedicated management screens render safely with no operational data", () => {
  const overview = load("components/sms/SmsOverview.tsx"),
    people = load("components/sms/SmsContacts.tsx"),
    campaigns = load("components/sms/SmsCampaignWorkspace.tsx"),
    messages = load("components/sms/SmsMessages.tsx");
  for (const Component of [
    overview.ReportsPage,
    overview.GatewayPage,
    overview.SettingsPage,
    people.ContactsPage,
    people.GroupsPage,
    campaigns.CampaignsPage,
    campaigns.TemplatesPage,
    messages.HistoryPage,
  ])
    assert.ok(render(Component).length > 50);
  const gateway = render(overview.GatewayPage);
  assert.ok(gateway.includes("وضعیت نامشخص"));
  assert.ok(gateway.includes("غیرفعال"));
  assert.ok(!gateway.includes("متصل است"));
});
