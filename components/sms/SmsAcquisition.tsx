"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Panel,
  Modal,
  Field,
  smsApi,
  useSms,
  useSmsResource,
  LoadingSkeleton,
  ResourceError,
} from "./SmsAdminShell";
import { faNumber, smsDate, stateLabels } from "@/lib/sms-admin-ui";
const segments: Record<string, string> = {
  all: "همه گیرندگان",
  unregistered: "مخاطبان ثبت‌نام‌نکرده",
  delivered_booth: "تحویل‌شده و غرفه‌ساخته",
  delivered_no_booth: "تحویل‌شده و بدون غرفه",
  no_click: "تحویل‌شده و بدون کلیک",
  clicked: "کلیک کرده، بدون شروع ثبت‌نام",
  incomplete: "ثبت‌نام ناقص",
  registered: "ثبت‌نام کامل، بدون غرفه",
  failed: "ارسال ناموفق",
  unknown: "تحویل نامشخص",
  opted_out: "لغو دریافت",
};
const engagements: Record<string, string> = {
  untracked: "ردیابی نشده",
  no_click: "بدون کلیک",
  clicked: "کلیک کرده",
  incomplete: "ثبت‌نام ناقص",
  registered: "حساب جدید ساخته",
  booth: "غرفه ساخته",
  published: "غرفه منتشرشده",
};
const eventLabels: Record<string, string> = {
  click: "باز شدن لینک",
  registration_view: "ورود به ثبت‌نام",
  registration_start: "شروع ثبت‌نام",
  booth_start: "شروع ساخت غرفه",
  account_created: "ایجاد حساب جدید",
  booth_created: "ثبت غرفه",
  booth_completed: "تکمیل ضروریات غرفه",
  booth_published: "انتشار غرفه",
  ...stateLabels,
};
type Row = {
  message_id: string;
  contact_id: string;
  phone_e164: string;
  display_name: string;
  campaign_name: string;
  campaign_id: string;
  city: string;
  area: string;
  trade: string;
  status: string;
  delivery: string;
  engagement: string;
  token: string | null;
  link_id: string | null;
  active: number;
  clicks: number;
  visitors:number;
  first_click: string;
  last_click: string;
  previous_messages: number;
  last_contact: string;
  opted_out: number;
  has_booth: number;
  booths: number;
  identity_match: number;
  uncertain_booths: number;
  variant: string;
  body: string;
};
type Data = {
  rows: Row[];
  summary: Record<string, number | null>;
  settings: { tracking_enabled: number };
  campaigns: { id: string; name: string }[];
  daily: {
    day: string;
    messages: number;
    delivered: number;
    clicks: number;
    accounts: number;
    booths: number;
  }[];
  compare: Comparison[];
  variants: Comparison[];
  cities: Comparison[];
  trades: Comparison[];
};
type Comparison = {
  name: string | null;
  messages: number;
  clicked: number;
  accounts: number;
  booths: number;
  estimated_cost: number | null;
};
function ComparisonTable({ rows }: { rows: Comparison[] }) {
  return rows.length ? (
    <div className="sms-table-wrap">
      <table>
        <thead>
          <tr>
            <th>عنوان</th>
            <th>پیام‌ها</th>
            <th>کلیک‌کنندگان</th>
            <th>حساب جدید</th>
            <th>غرفه</th>
            <th>هزینه تخمینی (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.name || "نامشخص"}</td>
              <td>{faNumber(r.messages)}</td>
              <td>{faNumber(r.clicked)}</td>
              <td>{faNumber(r.accounts)}</td>
              <td>{faNumber(r.booths)}</td>
              <td>
                {r.estimated_cost == null
                  ? "داده موجود نیست"
                  : faNumber(r.estimated_cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>داده موجود نیست.</p>
  );
}
export function AcquisitionPage({
  prospects = false,
}: {
  prospects?: boolean;
}) {
  const { notify } = useSms();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Record<string, string>>({
      segment: prospects ? "unregistered" : "all",
      ...(searchParams.get("campaign_id")
        ? { campaign_id: searchParams.get("campaign_id")! }
        : {}),
    }),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string[]>([]),
    [groupName, setGroupName] = useState(""),
    [details, setDetails] = useState<Row | null>(null),
    [profile, setProfile] = useState<Row | null>(null),
    [busy, setBusy] = useState(false);
  const qs = new URLSearchParams({ ...filters, page: String(page) }).toString();
  const {
    resource: data,
    error,
    loading,
    reload,
  } = useSmsResource<Data>("/api/admin/sms/acquisition?" + qs);
  const timeline = useSmsResource<{
    events: { kind: string; created_at: string }[];
  }>(
    "/api/admin/sms/acquisition?timeline=" +
      encodeURIComponent(details?.message_id || ""),
  );
  const update = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected([]);
  };
  async function act(b: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await smsApi("/api/admin/sms/acquisition", b);
      reload();
      notify("تغییرات ذخیره شد. هیچ پیامکی ارسال نشد.");
      return r;
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const stats = data?.summary;
  const number = (key: string) =>
    !stats || stats[key] == null
      ? "داده موجود نیست"
      : faNumber(Number(stats[key]));
  const cards = [
    ["recipients", "گیرندگان یکتا", "all"],
    ["sent", "پیامک‌های ارسال‌شده", "sent"],
    ["delivered", "تحویل‌شده", "delivered"],
    ["failed", "ارسال ناموفق", "failed"],
    ["unknown", "تحویل نامشخص", "unknown"],
    ["clicked", "لینک‌های کلیک‌شده", "any_click"],
    ["clicks", "کل کلیک‌ها", "any_click"],
    ["repeated_clicks", "کلیک‌های تکراری", "any_click"],
    ["suspicious_clicks", "کلیک‌های مشکوک", "all"],
    ["uncertain_booths", "غرفه با هویت گیرنده نامشخص", "all"],
    ["visitors", "بازدیدکنندگان معتبر برآوردی", "any_click"],
    ["no_click", "تحویل‌شده و بدون کلیک", "no_click"],
    ["clicked_not_started", "کلیک کرده و بدون شروع ثبت‌نام", "clicked"],
    ["incomplete", "ثبت‌نام ناقص", "incomplete"],
    ["accounts", "حساب‌های جدید", "new_account"],
    ["registered_no_booth", "ثبت‌نام کرده، بدون غرفه", "registered"],
    ["booths", "غرفه‌های جدید", "converted"],
    ["published", "غرفه‌های منتشرشده", "published"],
    ["delivered_booth", "تحویل‌شده و غرفه‌ساخته", "delivered_booth"],
    ["delivered_no_booth", "تحویل‌شده و بدون غرفه", "delivered_no_booth"],
    ["opted_out", "لغو دریافت", "opted_out"],
  ];
  return (
    <>
      <Panel
        title={prospects ? "مخاطبان ثبت‌نام‌نکرده" : "تحلیل کمپین و جذب غرفه"}
      >
        <p>
          گروه‌ها از اطلاعات واقعی و به‌صورت پویا محاسبه می‌شوند.
          «ثبت‌نام‌نکرده» در این فهرست یعنی مخاطب هنوز غرفه ندارد. کلیک، اثبات
          هویت صاحب شماره نیست؛ انتساب دستگاه دیگر بدون مدرک معتبر نامشخص
          می‌ماند.
        </p>
        <div className="sms-acquisition-filters">
          <Field label="گروه هوشمند">
            <select
              value={filters.segment}
              onChange={(e) => update("segment", e.target.value)}
            >
              {Object.entries(segments).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="کمپین">
            <select
              value={filters.campaign_id || ""}
              onChange={(e) => update("campaign_id", e.target.value)}
            >
              <option value="">همه کمپین‌ها</option>
              {data?.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {["city", "area", "trade", "q"].map((k, i) => (
            <Field
              key={k}
              label={["شهر", "منطقه", "گروه صنفی", "جست‌وجوی شماره یا نام"][i]}
            >
              <input
                value={filters[k] || ""}
                onChange={(e) => update(k, e.target.value)}
              />
            </Field>
          ))}
          <Field label="وضعیت تحویل">
            <select
              value={filters.delivery || ""}
              onChange={(e) => update("delivery", e.target.value)}
            >
              <option value="">همه</option>
              {[
                "delivered",
                "failed",
                "unknown",
                "queued",
                "leased",
                "cancelled",
              ].map((s) => (
                <option value={s} key={s}>
                  {stateLabels[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="وضعیت تعامل">
            <select
              value={filters.engagement || ""}
              onChange={(e) => update("engagement", e.target.value)}
            >
              <option value="">همه</option>
              {Object.entries(engagements).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="از تاریخ">
            <input
              type="date"
              value={filters.from || ""}
              onChange={(e) => update("from", e.target.value)}
            />
          </Field>
          <Field label="تا تاریخ">
            <input
              type="date"
              value={filters.to || ""}
              onChange={(e) => update("to", e.target.value)}
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={filters.latest === "1"}
              onChange={(e) => update("latest", e.target.checked ? "1" : "")}
            />{" "}
            فقط آخرین پیام هر مخاطب
          </label>
          <Field label="آخرین تماس از">
            <input
              type="date"
              value={filters.last_from || ""}
              onChange={(e) => update("last_from", e.target.value)}
            />
          </Field>
          <Field label="آخرین تماس تا">
            <input
              type="date"
              value={filters.last_to || ""}
              onChange={(e) => update("last_to", e.target.value)}
            />
          </Field>
          <Field label="حداقل پیامک قبلی">
            <input
              type="number"
              min="0"
              value={filters.min_messages || ""}
              onChange={(e) => update("min_messages", e.target.value)}
            />
          </Field>
          <Field label="مرتب‌سازی">
            <select
              value={filters.sort || "date"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="date">آخرین ارسال</option>
              <option value="phone">شماره</option>
              <option value="clicks">تعداد کلیک</option>
              <option value="messages">تعداد پیامک قبلی</option>
            </select>
          </Field>
        </div>
        <button
          className="sms-secondary"
          onClick={() => {
            setFilters({ segment: prospects ? "unregistered" : "all" });
            setPage(1);
          }}
        >
          پاک‌کردن فیلترها
        </button>
      </Panel>
      {error ? (
        <ResourceError message={error} retry={reload} />
      ) : loading && !data ? (
        <LoadingSkeleton />
      ) : (
        data && (
          <>
            {!prospects && (
              <>
                <div className="sms-acquisition-cards">
                  {cards.map(([k, l, s]) => (
                    <button
                      key={k}
                      className="sms-secondary"
                      onClick={() => update("segment", s)}
                    >
                      <span>{l}</span>
                      <strong>{number(k)}</strong>
                    </button>
                  ))}
                  <div>
                    <span>نرخ تبدیل پیامک به غرفه</span>
                    <strong>
                      {stats?.sent && stats.tracked_count
                        ? faNumber(
                            (Number(stats.converted_recipients || 0) /
                              stats.sent) *
                              100,
                          ) + "٪"
                        : "داده موجود نیست"}
                    </strong>
                  </div>
                  <div>
                    <span>هزینه تخمینی جذب هر غرفه</span>
                    <strong>
                      {stats?.booths && !stats.missing_cost
                        ? faNumber(
                            Number(stats.estimated_cost) / stats.booths,
                          ) + " تومان"
                        : "داده موجود نیست"}
                    </strong>
                  </div>
                </div>
                <Panel title="هزینه واقعی جذب">
                  <p>
                    هزینه واقعی کمپین‌های انتخاب‌شده:{" "}
                    {stats?.actual_cost != null && !stats.missing_actual
                      ? faNumber(stats.actual_cost) + " تومان"
                      : "داده موجود نیست"}
                  </p>
                  <p>
                    هزینه واقعی جذب هر غرفه:{" "}
                    {stats?.actual_cost_comparable &&
                    stats.booths &&
                    stats.actual_cost != null &&
                    !stats.missing_actual
                      ? faNumber(stats.actual_cost / stats.booths) + " تومان"
                      : "داده موجود نیست؛ برای مقایسه فقط فیلتر کمپین را انتخاب کنید"}
                  </p>
                  <p>
                    هزینه واقعی جذب هر حساب جدید:{" "}
                    {stats?.actual_cost_comparable &&
                    stats.accounts &&
                    stats.actual_cost != null &&
                    !stats.missing_actual
                      ? faNumber(stats.actual_cost / stats.accounts) + " تومان"
                      : "داده موجود نیست"}
                  </p>
                </Panel>
                <Panel title="قیف تبدیل و مدل انتساب">
                  <div className="sms-acquisition-funnel">
                    {[
                      ["sent", "ارسال‌شده"],
                      ["clicked", "کلیک‌کننده"],
                      ["started", "شروع ثبت‌نام"],
                      ["accounts", "حساب جدید"],
                      ["booths", "غرفه جدید"],
                    ].map(([k, l]) => (
                      <div key={k}>
                        <span>{l}</span>
                        <strong>{number(k)}</strong>
                      </div>
                    ))}
                  </div>
                  <p>
                    انتساب آخرین کلیک معتبر در ۳۰ روز: {number("accounts")} حساب
                    و {number("booths")} غرفه. انتساب اولین تماس:{" "}
                    {number("first_accounts")} حساب و {number("first_booths")}{" "}
                    غرفه.
                  </p>
                  <p>
                    نرخ تبدیل میان پیامک‌های تحویل‌شده:{" "}
                    {stats?.delivered && stats.tracked_count
                      ? faNumber(
                          (Number(stats.delivered_booth || 0) /
                            stats.delivered) *
                            100,
                        ) + "٪"
                      : "داده موجود نیست"}
                    . آمار تحویل مستقل از قیف است.
                  </p>
                </Panel>
                <Panel title="روند روزانه">
                  <div className="sms-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>روز</th>
                          <th>پیام‌ها</th>
                          <th>تحویل</th>
                          <th>بازدید معتبر</th>
                          <th>حساب جدید</th>
                          <th>غرفه جدید</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.daily.map((d) => (
                          <tr key={d.day}>
                            <td>{d.day}</td>
                            {[
                              d.messages,
                              d.delivered,
                              d.clicks,
                              d.accounts,
                              d.booths,
                            ].map((v, i) => (
                              <td key={i}>
                                <span
                                  className="sms-mini-bar"
                                  style={{
                                    width: Math.max(2, Math.min(100, v)),
                                  }}
                                />
                                {faNumber(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!data.daily.length && <p>داده موجود نیست.</p>}
                </Panel>
                <Panel title="مقایسه کمپین‌ها">
                  <ComparisonTable rows={data.compare} />
                </Panel>
                <Panel title="مقایسه نسخه‌های متن">
                  <p>
                    تقسیم نسخه‌ها تصادفی و ثابت برای هر گیرنده است. در نمونه‌های
                    کوچک برنده قطعی اعلام نمی‌شود.
                  </p>
                  <ComparisonTable rows={data.variants} />
                </Panel>
                <Panel title="مقایسه گروه‌های صنفی">
                  <ComparisonTable rows={data.trades} />
                </Panel>
                <Panel title="مقایسه شهرها">
                  <ComparisonTable rows={data.cities} />
                </Panel>
                <Panel title="کنترل ردیابی و هزینه">
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(data.settings?.tracking_enabled)}
                      disabled={busy}
                      onChange={(e) =>
                        void act({
                          action: "tracking",
                          enabled: e.target.checked,
                        })
                      }
                    />{" "}
                    ردیابی لینک‌ها فعال باشد
                  </label>
                  <p>
                    خاموش‌کردن ردیابی مانع استفاده از لینک و ثبت غرفه نمی‌شود.
                    هزینه‌ها به تومان هستند.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void act({
                        action: "cost",
                        id: f.get("campaign"),
                        cost: f.get("cost"),
                      });
                    }}
                  >
                    <Field label="کمپین">
                      <select name="campaign" required>
                        {data.campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="هزینه واقعی کل (تومان)">
                      <input
                        name="cost"
                        type="number"
                        min="0"
                        step="any"
                        required
                      />
                    </Field>
                    <button disabled={busy}>ثبت هزینه واقعی</button>
                  </form>
                </Panel>
              </>
            )}
            <Panel
              title="فهرست گیرندگان"
              action={
                <a href={"/api/admin/sms/acquisition?" + qs + "&export=csv"}>
                  خروجی CSV
                </a>
              }
            >
              <p>
                تحویل نامشخص به معنی تحویل‌نشدن نیست. «ناموفق» شامل شکست ارسال و
                انقضای پیش از ارسال است؛ جزئیات در خط زمانی قابل مشاهده است.
                برای کمپین بعدی، شماره‌های لغو دریافت و دارای غرفه کنار گذاشته
                می‌شوند.
              </p>
              <div className="sms-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>انتخاب</th>
                      <th>شماره</th>
                      <th>کمپین / نسخه</th>
                      <th>شهر / منطقه / صنف</th>
                      <th>ارسال</th>
                      <th>تحویل</th>
                      <th>لینک</th>
                      <th>کلیک‌ها</th>
                      <th>اولین / آخرین کلیک</th>
                      <th>تعامل</th>
                      <th>گروه هوشمند</th>
                      <th>پیامک قبلی / آخرین تماس</th>
                      <th>وضعیت دریافت</th>
                      <th>جزئیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.message_id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={"انتخاب " + r.phone_e164}
                            checked={selected.includes(r.contact_id)}
                            onChange={(e) =>
                              setSelected((s) =>
                                e.target.checked
                                  ? [...new Set([...s, r.contact_id])]
                                  : s.filter((id) => id !== r.contact_id),
                              )
                            }
                          />
                        </td>
                        <td dir="ltr">
                          {r.phone_e164}
                          <small>{r.contact_id}</small>
                        </td>
                        <td>
                          {r.campaign_name} / {r.variant || "—"}
                        </td>
                        <td>
                          {[r.city, r.area, r.trade]
                            .filter(Boolean)
                            .join(" / ") || "ثبت نشده"}
                          <button
                            className="sms-secondary"
                            onClick={() => setProfile({ ...r })}
                          >
                            ویرایش
                          </button>
                        </td>
                        <td>{stateLabels[r.status]}</td>
                        <td>{stateLabels[r.delivery] || r.delivery}</td>
                        <td>
                          {r.token ? (
                            <>
                              <button
                                className="sms-secondary"
                                onClick={() =>
                                  void navigator.clipboard
                                    .writeText(
                                      "https://khonenama.ir/s/" + r.token,
                                    )
                                    .then(() => notify("لینک کپی شد."))
                                }
                              >
                                کپی لینک
                              </button>
                              <button
                                className="sms-secondary"
                                disabled={busy}
                                onClick={() =>
                                  void act({
                                    action: "link",
                                    id: r.link_id,
                                    active: !r.active,
                                  })
                                }
                              >
                                {r.active ? "غیرفعال‌کردن" : "فعال‌کردن"}
                              </button>
                            </>
                          ) : (
                            "بدون لینک اختصاصی"
                          )}
                        </td>
                        <td>{faNumber(r.clicks)}</td>
                        <td>
                          {smsDate(r.first_click)}
                          <br />
                          {smsDate(r.last_click)}
                        </td>
                        <td>
                          {engagements[r.engagement]}
                          {r.uncertain_booths > 0 && (
                            <small>
                              صاحب حساب با شماره گیرنده متفاوت است؛ هویت گیرنده
                              نامشخص
                            </small>
                          )}
                        </td>
                        <td>
                          {r.booths > 0
                            ? "غرفه ایجادشده"
                            : r.has_booth
                              ? "غرفه‌دار قبلی"
                              : r.delivery === "failed"
                                ? "ارسال ناموفق"
                                : r.delivery === "unknown"
                                  ? "تحویل نامشخص"
                                  : r.delivery === "delivered"
                                    ? r.visitors
                                      ? "تحویل‌شده و کلیک کرده"
                                      : "تحویل‌شده و بدون کلیک"
                                    : "در انتظار"}
                        </td>
                        <td>
                          {faNumber(r.previous_messages)}
                          <br />
                          {smsDate(r.last_contact)}
                        </td>
                        <td>{r.opted_out ? "لغو دریافت" : "قابل ارسال"}</td>
                        <td>
                          <button onClick={() => setDetails(r)}>
                            پیام و خط زمانی
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.rows.length && <p>مخاطبی با این فیلتر وجود ندارد.</p>}
              <div className="sms-modal-actions">
                <button
                  className="sms-secondary"
                  onClick={() =>
                    setSelected([
                      ...new Set(data.rows.map((r) => r.contact_id)),
                    ])
                  }
                >
                  انتخاب این صفحه
                </button>
                <button
                  className="sms-secondary"
                  onClick={() => setSelected([])}
                >
                  لغو انتخاب
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  قبلی
                </button>
                <span>صفحه {faNumber(page)}</span>
                <button
                  disabled={page * 25 >= Number(stats?.total || 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  بعدی
                </button>
              </div>
              <Field label="نام گروه برای کمپین بعدی">
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </Field>
              <button
                disabled={busy || !groupName.trim()}
                onClick={async () => {
                  const r = await act({
                    action: "saveAudience",
                    name: groupName,
                    filters,
                    contactIds: selected,
                  });
                  if (r)
                    notify(
                      `گروه با ${faNumber(r.count)} مخاطب ذخیره شد. برای ارسال، کمپین جدید بسازید و تأیید کنید.`,
                    );
                }}
              >
                ذخیره{" "}
                {selected.length
                  ? "مخاطبان انتخاب‌شده"
                  : "همه نتایج واجد شرایط"}
              </button>
              <Link href="/sms/campaigns?new=1"> ساخت کمپین جدید</Link>
            </Panel>
          </>
        )
      )}
      {details && (
        <Modal
          title="جزئیات پیام و رویدادهای واقعی"
          onClose={() => setDetails(null)}
        >
          <p dir="ltr">{details.phone_e164}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{details.body}</p>
          <p>شناسه پیام: {details.message_id}</p>
          {timeline.resource?.events.map((e, i) => (
            <p key={i}>
              {eventLabels[e.kind] || e.kind} — {smsDate(e.created_at)}
            </p>
          ))}
        </Modal>
      )}
      {profile && (
        <Modal title="اطلاعات گروه‌بندی مخاطب" onClose={() => setProfile(null)}>
          {(["city", "area", "trade"] as const).map((k, i) => (
            <Field key={k} label={["شهر", "منطقه", "گروه صنفی"][i]}>
              <input
                value={profile[k] || ""}
                onChange={(e) =>
                  setProfile({ ...profile, [k]: e.target.value })
                }
              />
            </Field>
          ))}
          <button
            disabled={busy}
            onClick={async () => {
              if (
                await act({
                  action: "profile",
                  id: profile.contact_id,
                  city: profile.city,
                  area: profile.area,
                  trade: profile.trade,
                })
              )
                setProfile(null);
            }}
          >
            ذخیره
          </button>
        </Modal>
      )}
    </>
  );
}
export const ProspectsPage = () => <AcquisitionPage prospects />;
