"use client";
import {CommandDashboard} from './SmsCommandCenter';
import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  EmptyState,
  GatewayStatus,
  LoadingSkeleton,
  Panel,
  ResourceError,
  StatCard,
  useSms,
  useSmsResource,
} from "./SmsAdminShell";
import { faNumber, smsDate, stateLabels } from "@/lib/sms-admin-ui";
type Report = {
  from: string;
  to: string;
  daily: { day: string; count: number }[];
  outcomes: { status: string; count: number }[];
  categories: { category: string; count: number }[];
  consents: { status: string; count: number }[];
  optouts: number;
};
export function ActivityChart({ daily }: { daily: Report["daily"] }) {
  if (!daily.length)
    return (
      <EmptyState
        title="هنوز فعالیتی ثبت نشده"
        text="پس از ثبت پیام، نمودار حجم پیام‌های ایجادشده از داده‌های واقعی ساخته می‌شود."
      />
    );
  const max = Math.max(...daily.map((v) => v.count), 1);
  return (
    <>
      <div
        className="sms-chart"
        role="img"
        aria-label="تعداد پیام‌های ایجادشده به تفکیک روز؛ زمان مبنا هماهنگ جهانی است"
      >
        {daily.map((day) => (
          <div key={day.day} title={`${day.day}: ${faNumber(day.count)}`}>
            <strong>{faNumber(day.count)}</strong>
            <i
              style={{ height: `${Math.max(3, (day.count / max) * 130)}px` }}
            />
            <small>
              <bdi>{day.day.slice(5)}</bdi>
            </small>
          </div>
        ))}
      </div>
      <details className="sms-chart-data">
        <summary>داده‌های نمودار</summary>
        <ul>
          {daily.map((d) => (
            <li key={d.day}>
              <bdi>{d.day}</bdi>: {faNumber(d.count)} پیام
            </li>
          ))}
        </ul>
      </details>
      <p className="sms-muted">
        حجم پیام‌های ایجادشده در هر روز، شامل پیش‌نویس؛ مبنای روزها زمان هماهنگ
        جهانی است.
      </p>
    </>
  );
}
export function DashboardPage() { return <CommandDashboard/>; }
export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(
      new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    ),
    [to, setTo] = useState(today),
    [query, setQuery] = useState(`from=${from}&to=${to}`);
  const { resource, error, loading, reload } = useSmsResource<Report>(
    "/api/admin/sms/workspace?view=reports&" + query,
  );
  const { data } = useSms();
  return (
    <>
      <Panel>
        <form
          className="sms-filter-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(new URLSearchParams({ from, to }).toString());
          }}
        >
          <label>
            از تاریخ میلادی
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </label>
          <label>
            تا تاریخ میلادی
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </label>
          <button>نمایش گزارش</button>
        </form>
        <p className="sms-muted">
          بازه بر مبنای روزهای زمان هماهنگ جهانی محاسبه می‌شود؛ حداکثر یک سال.
        </p>
      </Panel>
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ResourceError message={error} retry={reload} />
      ) : (
        resource && (
          <>
            <div className="sms-stats">
              <StatCard
                title="پیام‌های ایجادشده"
                value={resource.outcomes.reduce((a, v) => a + v.count, 0)}
              />
              <StatCard
                title="مخاطبان قابل ارسال"
                value={data.summary.consented_contacts}
                hint="وضعیت فعلی، همهٔ زمان‌ها"
              />
              <StatCard title="لغو عضویت در بازه" value={resource.optouts} />
              <StatCard
                title="نرخ دسترس‌پذیری درگاه"
                value={null}
                hint="تاریخچهٔ اتصال برای محاسبه موجود نیست"
              />
            </div>
            <Panel title="حجم پیام‌های ایجادشده">
              <ActivityChart daily={resource.daily} />
            </Panel>
            <div className="sms-two-columns">
              <Panel title="وضعیت فعلی پیام‌های بازه">
                {resource.outcomes.length ? (
                  <ul className="sms-report-list">
                    {resource.outcomes.map((row) => (
                      <li key={row.status}>
                        <Badge state={row.status} />
                        <strong>{faNumber(row.count)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="داده‌ای در این بازه نیست"
                    text="بازهٔ دیگری را انتخاب کنید."
                  />
                )}
                <p className="sms-muted">
                  پذیرش در گوشی به معنای تحویل به گیرنده نیست. نرخ موفقیت بدون
                  شواهد تحویل محاسبه نمی‌شود.
                </p>
              </Panel>
              <Panel title="نوع استفاده">
                <ul className="sms-report-list">
                  {resource.categories.map((row) => (
                    <li key={row.category}>
                      <span>
                        {row.category === "transactional"
                          ? "عملیاتی"
                          : "تبلیغاتی"}
                      </span>
                      <strong>{faNumber(row.count)}</strong>
                    </li>
                  ))}
                </ul>

                <p>
                  مخاطبان قابل ارسال، همهٔ زمان‌ها:{" "}
                  {faNumber(data.summary.consented_contacts)}
                </p>
                <p className="sms-muted">
                  هزینه و نرخ تبدیل دادهٔ معتبری ندارند.
                </p>
              </Panel>
            </div>
            <Panel title="عملکرد کمپین‌ها">
              <p>
                تعداد مخاطبان واجد شرایط و پیام‌های ثبت‌شده در صف در صفحهٔ
                کمپین‌ها نمایش داده می‌شود.
              </p>
              <Link href="/sms/campaigns">مشاهده عملکرد کمپین‌ها</Link>
            </Panel>
          </>
        )
      )}
    </>
  );
}
export function GatewayPage() {
  const { data } = useSms();
  const seen=data.agent?.last_inbox_at;
  const fresh=seen && Date.now()-Date.parse(seen.replace(' ','T')+(/Z|[+]\d\d:\d\d$/.test(seen)?'':'Z'))<300000;
  return (
    <div className="sms-two-columns">
      <Panel title="درگاه اندروید و عامل ویندوز">
        <p>گوشی: {fresh?"ارتباط اخیر دریافت تأیید شده":"نیازمند بررسی"}</p><p>آخرین ارتباط دریافت: {smsDate(seen)}</p><GatewayStatus />
        <p>
          دریافت پیام از گوشی:{" "}
          {data.agent?.inbound_enabled ? "فعال" : "غیرفعال"}
        </p>
        <p className="sms-muted">
          ارتباط اخیر عامل، اتصال موفق به خود گوشی را اثبات نمی‌کند. تأیید ارتباط دریافت گوشی به معنی سلامت ارسال سیم‌کارت نیست.
        </p>
      </Panel>
      <details className="sms-panel"><summary>جزئیات فنی و راهنمای اتصال</summary>
        <ol className="sms-checklist">
          <li>
            کلید عامل ارتباطی:{" "}
            {data.setup.bridgeCredentialConfigured
              ? "ثبت شده"
              : "هنوز تنظیم نشده"}
          </li>
          <li>بررسی نسخهٔ برنامهٔ گوشی و نشانی‌های همان نسخه</li>
          <li>
            تنظیم عامل ویندوز در شبکهٔ محلی؛ بدون انتشار درگاه گوشی در اینترنت
          </li>
          <li>بررسی روش انتخاب سیم‌کارت تعیین‌شده و دریافت وضعیت واقعی</li>
          <li>آزمون یک پیام فقط با اجازهٔ جداگانهٔ مالک</li>
        </ol>
        <p className="sms-alert">این صفحه ارسال واقعی را فعال نمی‌کند.</p>
        <p>
          خطای اخیر عامل:{" "}
          {data.agent?.last_error
            ? "خطایی ثبت شده است؛ گزارش عامل روی رایانه بررسی شود."
            : "خطایی ثبت نشده است."}
        </p>
        <p className="sms-muted">
          متن فنی خطا و مقادیر اتصال برای جلوگیری از افشای اطلاعات حساس نمایش
          داده نمی‌شود.
        </p>
      </details>
    </div>
  );
}
export function SettingsPage() {
  const { data } = useSms();
  return (
    <div className="sms-two-columns">
      <Panel title="عمومی و دسترسی">
        <dl className="sms-definition">
          <dt>فضای کاری</dt>
          <dd>خونه‌نما</dd>
          <dt>روش ورود</dt>
          <dd>
            {data.setup.separateKeyConfigured
              ? "رمز مدیریت و کلید اختصاصی پیامک"
              : "رمز مدیریت خونه‌نما"}
          </dd>
          <dt>زمان نمایش</dt>
          <dd>تهران</dd>
          <dt>ارسال واقعی</dt>
          <dd>
            {data.liveSendingEnabled ? "اجازهٔ نرم‌افزاری فعال" : "خاموش"}
          </dd>
        </dl>
        <p className="sms-muted">
          تغییر رمز و کلیدها از تنظیمات امن Cloudflare انجام می‌شود؛ مقدار آن‌ها
          در پنل نمایش داده نمی‌شود.
        </p>
      </Panel>
      <Panel title="محدودیت‌ها و نگهداری داده">
        <ul className="sms-checklist">
          <li>متن پیام و قالب: حداکثر ۱۰۰۰ نویسه</li>
          <li>ورود CSV: پردازش مرحله‌ای با امکان ادامه پس از قطع ارتباط</li>
          <li>سقف گیرندگان هر کمپین: حداکثر ۱۰٬۰۰۰ مخاطب</li>
          <li>
            سرعت ارسال توسط عامل ارتباطی کنترل می‌شود؛ از این صفحه قابل افزایش
            نیست.
          </li>
          <li>
            پاک‌سازی محتوای قدیمی مطابق سیاست نگهداری سمت سرور انجام می‌شود.
          </li>
          <li>پیام‌های نامشخص بدون تطبیق وضعیت، دوباره ارسال نمی‌شوند.</li>
        </ul>
      </Panel>
      <Panel title="عیب‌یابی امن">
        <p>
          برای بررسی وضعیت درگاه، زمان آخرین ارتباط و کلید عامل به صفحهٔ اتصال
          گوشی بروید.
        </p>
        <Link className="sms-button sms-secondary" href="/sms/gateway">
          بررسی اتصال گوشی
        </Link>
      </Panel>
    </div>
  );
}
