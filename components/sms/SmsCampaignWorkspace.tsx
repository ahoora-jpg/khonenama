"use client";
import { useState } from "react";
import {SmsCsvImport} from "./SmsCsvImport";
import { useSearchParams } from "next/navigation";
import { estimateSms } from "@/lib/sms-text";
import { faNumber, smsDate } from "@/lib/sms-admin-ui";
import {
  Badge,
  EmptyState,
  Field,
  LoadingSkeleton,
  MessagePreview,
  Modal,
  Panel,
  ResourceError,
  SearchBox,
  smsApi,
  useSms,
  useSmsResource,
} from "./SmsAdminShell";
type Campaign = {
  group_id:string;
  variant_b:string|null;
  id: string;
  name: string;
  body: string;
  status: string;
  scheduled_at: string | null;
  max_recipients: number;
  group_count: number;
  eligible_count: number;
  queued_count: number;
};
type CampaignData = {
  groups: { id: string; name: string }[];
  campaigns: Campaign[];
};
type GroupSummary = {
  groups: {
    id: string;
    name: string;
    member_count: number;
    eligible_count: number;
  }[];
};
const steps = [
  "مشخصات",
  "مخاطبان",
  "متن پیام",
  "زمان و محدودیت",
  "بازبینی",
  "ذخیره",
];
export function CampaignsPage() {
  const { data, notify, refresh } = useSms();
  const [tracking, setTracking] = useState(false),
    [destination, setDestination] = useState("/register-business"),
    [variantB, setVariantB] = useState(""),
    [tariff, setTariff] = useState(""),
    [cooldownDays, setCooldownDays] = useState(7),
    [linkExpires, setLinkExpires] = useState(""),
    [preview, setPreview] = useState<any[] | null>(null);
  const params = useSearchParams();
  const [wizard, setWizard] = useState(params.get("new") === "1"),
    [step, setStep] = useState(0),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(params.get("status")||""),
    [name, setName] = useState(""),
    [groupId, setGroupId] = useState(params.get("groupId")||""),
    [body, setBody] = useState(""),
    [limit, setLimit] = useState(10),
    [schedule, setSchedule] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmation, setConfirmation] = useState<{
      action: string;
      id: string;
    } | null>(null),
    [formError, setFormError] = useState("");
  const { resource, error, loading, reload } = useSmsResource<CampaignData>(
    "/api/admin/sms/campaigns",
  );
  const visibleCampaigns=resource?.campaigns.filter(c=>c.name.includes(q)&&(!status||(status==='active'?['approved','running'].includes(c.status):c.status===status)))||[];
  const groups = useSmsResource<GroupSummary>(
    "/api/admin/sms/workspace?view=groups",
  );
  const group = groups.resource?.groups.find((g) => g.id === groupId);
  const sampleLink='https://khonenama.ir/s/'+'a'.repeat(40);
  const displayBody=tracking?(body.includes('{{registration_link}}')?body.replaceAll('{{registration_link}}',sampleLink):body+'\n'+sampleLink):body;
  const estimate=estimateSms(displayBody);
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const value = await smsApi("/api/admin/sms/campaigns", payload);
      notify(
        payload.action === "create"
          ? "پیش‌نویس کمپین ذخیره شد؛ فعال نشده است."
          : "وضعیت کمپین به‌روزرسانی شد.",
      );
      reload();
      await refresh();
      return value;
    } catch (e) {
      notify((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  function advance() {
    const message =
      step === 0 && !name.trim()
        ? "نام کمپین را وارد کنید."
        : step === 1 && !groupId
          ? "یک گروه مخاطب انتخاب کنید."
          : step === 2 && !body.trim()
            ? "متن پیام را وارد کنید."
            : step === 3 &&
                (!Number.isInteger(limit) || limit < 1 || limit > 10000)
              ? "سقف گیرندگان باید بین ۱ و ۱۰٬۰۰۰ باشد."
              : step === 3 &&
                  schedule &&
                  (!Number.isFinite(Date.parse(schedule)) ||
                    Date.parse(schedule) <= Date.now())
                ? "زمان شروع باید در آینده باشد."
                : "";
    setFormError(message);
    if (!message) setStep((v) => Math.min(5, v + 1));
  }
  return (
    <>
      {preview && (
        <Modal
          title="پیش‌نمایش نهایی ۲۵ گیرنده اول؛ بدون ارسال"
          onClose={() => setPreview(null)}
        >
          {preview.map((r) => (
            <div key={r.contactId}>
              <p dir="ltr">{r.phone}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{r.body}</p>
              <p>
                {faNumber(r.units)} نویسه / {faNumber(r.parts)} بخش — هزینه:{" "}
                {r.estimatedCost == null
                  ? "داده موجود نیست"
                  : faNumber(r.estimatedCost) + " تومان"}
              </p>
            </div>
          ))}
        </Modal>
      )}
      <Panel
        title="فهرست کمپین‌ها"
        action={
          <button
            onClick={() => {
              setWizard(true);
              setStep(0);
            }}
          >
            ساخت کمپین
          </button>
        }
      >
        <div className="sms-filter-toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="جست‌وجوی نام کمپین"
          />
          <label className="sms-filter-label">
            وضعیت
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">همه</option><option value="active">کمپین‌های فعال</option>
              <option value="draft">پیش‌نویس</option>
              <option value="approved">تأییدشده</option>
              <option value="running">در حال ثبت</option>
              <option value="paused">متوقف</option>
              <option value="completed">پایان‌یافته</option>
              <option value="cancelled">لغوشده</option>
            </select>
          </label>
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ResourceError message={error} retry={reload} />
        ) : visibleCampaigns.length ? (
          <div className="sms-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>کمپین و متن</th>
                  <th>وضعیت</th>
                  <th>مخاطبان گروه</th>
                  <th>قابل ارسال</th>
                  <th>شروع</th>
                  <th>پیشرفت ثبت در صف</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <details>
                          <summary>{c.name}</summary>
                          <p className="sms-message-body">{c.body}</p>
                          {[c.body,c.variant_b].map((text,index)=>text&&<button key={index} className="sms-secondary" onClick={()=>{setName(c.name+' — '+(index?'نسخه دوم':'نسخه اول'));setBody(text);setGroupId(c.group_id);setTracking(text.includes('{{registration_link}}'));setVariantB('');setSchedule('');setStep(0);setWizard(true);}}>انتخاب {index?'نسخه دوم':'نسخه اول'} برای کمپین جدید</button>)}
                        </details>
                      </td>
                      <td>
                        <Badge state={c.status} />{c.status==='completed'&&<small>ثبت صف پایان یافته؛ نتیجهٔ ارسال را در «تحلیل و گیرندگان» ببینید.</small>}
                      </td>
                      <td>{faNumber(c.group_count)}</td>
                      <td>{faNumber(c.eligible_count)}</td>
                      <td>{smsDate(c.scheduled_at)}</td>
                      <td>
                        <span>
                          {faNumber(c.queued_count)} از سقف{" "}
                          {faNumber(c.max_recipients)}
                        </span>
                        <progress
                          max={c.max_recipients}
                          value={c.queued_count}
                          aria-label={"پیام‌های ثبت‌شده در صف کمپین " + c.name}
                        />
                      </td>
                      <td>
                        <button className="sms-quiet sms-danger-text" disabled={busy} onClick={()=>{if(window.confirm('کمپین از فهرست حذف شود؟ پیام‌های در صف آن لغو می‌شوند؛ سابقه ارسال‌های انجام‌شده باقی می‌ماند.'))void act({action:'remove',id:c.id});}}>حذف کمپین</button>
                        <a href={"/sms/acquisition?campaign_id=" + c.id}>
                          تحلیل و گیرندگان
                        </a>
                        <button
                          className="sms-quiet"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              const r = await smsApi(
                                "/api/admin/sms/acquisition",
                                { action: "preview", id: c.id },
                              );
                              setPreview(r.rows);
                            } catch (e) {
                              notify((e as Error).message);
                            }
                          }}
                        >
                          پیش‌نمایش گیرندگان
                        </button>
                        {c.status === "completed" && c.queued_count === 0 && (
                          <button
                            className="sms-quiet"
                            disabled={busy || !data.liveSendingEnabled}
                            onClick={() =>
                              setConfirmation({
                                action: "retryEmpty",
                                id: c.id,
                              })
                            }
                          >
                            اجرای مجدد
                          </button>
                        )}
                        {c.status === "draft" && (
                          <button
                            className="sms-quiet"
                            disabled={busy || !data.liveSendingEnabled}
                            title={
                              !data.liveSendingEnabled
                                ? "ارسال واقعی خاموش است"
                                : undefined
                            }
                            onClick={() =>
                              setConfirmation({ action: "approve", id: c.id })
                            }
                          >
                            درخواست فعال‌سازی
                          </button>
                        )}
                        {c.status === "running" && (
                          <button
                            className="sms-quiet"
                            disabled={busy}
                            onClick={() =>
                              void act({ action: "pause", id: c.id })
                            }
                          >
                            توقف
                          </button>
                        )}
                        {c.status === "paused" && (
                          <button
                            className="sms-quiet"
                            disabled={busy || !data.liveSendingEnabled}
                            onClick={() =>
                              setConfirmation({ action: "resume", id: c.id })
                            }
                          >
                            ادامه
                          </button>
                        )}
                        {["draft", "approved", "running", "paused"].includes(
                          c.status,
                        ) && (
                          <button
                            className="sms-quiet sms-danger-text"
                            disabled={busy}
                            onClick={() =>
                              setConfirmation({ action: "cancel", id: c.id })
                            }
                          >
                            لغو
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={q||status?"کمپینی با این فیلتر پیدا نشد":"هنوز کمپینی ساخته نشده"}
            text="گروه مخاطبان، متن و زمان‌بندی را انتخاب کنید و کمپین بسازید."
          />
        )}
        <p className="sms-muted">
          ۵۰ کمپین آخر نمایش داده می‌شود. پیشرفت جدول، ثبت در صف است و به معنی
          ارسال یا تحویل نیست.
        </p>
      </Panel>
      {wizard && (
        <Modal title="ساخت کمپین" onClose={() => setWizard(false)}>
          <ol className="sms-steps" aria-label="مراحل ساخت کمپین">
            {steps.map((title, i) => (
              <li
                className={
                  i === step ? "is-active" : i < step ? "is-complete" : ""
                }
                key={title}
                aria-current={i === step ? "step" : undefined}
              >
                <span>{faNumber(i + 1)}</span>
                {title}
              </li>
            ))}
          </ol>
          <div className="sms-form">
            {formError && (
              <p role="alert" className="sms-alert sms-error">
                {formError}
              </p>
            )}
            {step === 0 && (
              <>
                <Field label="نام و هدف کمپین">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    required
                    placeholder="برای مثال: اطلاع‌رسانی پیشنهاد پاییز"
                  />
                </Field>
                <Field label="نوع کمپین">
                  <input value="تبلیغاتی" readOnly />
                </Field>
                <p className="sms-muted">
                  کمپین فعلی برای تبلیغات گروهی است. پیام عملیاتی را از صفحهٔ
                  ارسال پیامک ثبت کنید.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <SmsCsvImport groupId={groupId||undefined} onImported={id=>{setGroupId(id);groups.reload();reload();}}/>
                {groups.error ? (
                  <ResourceError message={groups.error} retry={groups.reload} />
                ) : (
                  <Field label="گروه مخاطبان">
                    <select
                      required
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                    >
                      <option value="">انتخاب گروه</option>
                      {groups.resource?.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {group && (
                  <p>
                    {faNumber(group.member_count)} عضو ·{" "}
                    {faNumber(group.eligible_count)} مخاطب قابل ارسال
                  </p>
                )}
                <p className="sms-muted">
                  شماره‌های تکراری دوباره ارسال نمی‌شوند. شماره‌های لغو دریافت
                  در زمان ارسال کنار گذاشته می‌شوند.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <Field label="متن کمپین">
                  <textarea
                    required
                    maxLength={1000}
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </Field>
                <MessagePreview body={displayBody} parts={estimate.parts} />
                <label>
                  <input
                    type="checkbox"
                    checked={tracking}
                    onChange={(e)=>setTracking(e.target.checked)}
                  />{" "}
                  برای هر شماره، خودکار لینک جداگانه بساز و اضافه کن
                </label>
                {tracking && (
                  <>
                    <Field label="مقصد لینک">
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      >
                        <option value="/register-business">ساخت غرفه</option>
                        <option value="/for-business">
                          معرفی خدمات کسب‌وکار
                        </option>
                      </select>
                    </Field>
                    <p>شما فقط متن پیام را بنویسید. سامانه برای هر شماره یک لینک متفاوت می‌سازد و پایین پیام می‌گذارد؛ حتی برای ۵۰۰ نفر نیازی به واردکردن لینک ندارید.</p>
                    <Field label="نسخه دوم متن (اختیاری برای مقایسه)">
                      <textarea
                        maxLength={1000}
                        value={variantB}
                        onChange={(e) => setVariantB(e.target.value)}
                      />
                    </Field>
                    <p>
                      لینک به هر دو نسخه خودکار اضافه می‌شود. هر
                      گیرنده فقط یکی از نسخه‌ها را دریافت می‌کند.
                    </p>
                    <Field label="انقضای اختیاری لینک">
                      <input
                        type="datetime-local"
                        value={linkExpires}
                        onChange={(e) => setLinkExpires(e.target.value)}
                      />
                    </Field>
                  </>
                )}
                <Field label="تعرفه هر بخش (تومان، اختیاری)">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={tariff}
                    onChange={(e) => setTariff(e.target.value)}
                  />
                </Field>
                <p>
                  {tariff
                    ? `هزینه تخمینی هر گیرنده: ${faNumber(estimate.parts * Number(tariff))} تومان`
                    : "هزینه: داده موجود نیست"}
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <Field label="حداقل فاصله تبلیغ به یک مخاطب (روز)">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={cooldownDays}
                    onChange={(e) => setCooldownDays(Number(e.target.value))}
                  />
                </Field>
                <p>
                  دارندگان غرفه و شماره‌های لغو دریافت از دعوت به ساخت اولین
                  غرفه کنار گذاشته می‌شوند.
                </p>
                <Field label="زمان شروع اختیاری">
                  <input
                    type="datetime-local"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  />
                </Field>
                <Field label="سقف گیرندگان">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  />
                </Field>
                <p className="sms-muted">
                  سرعت ارسال توسط عامل ارتباطی کنترل می‌شود و در این نسخه از فرم
                  کمپین قابل تغییر نیست. زمان‌بندی پس از فعال‌سازی و آماده‌بودن
                  درگاه اعمال می‌شود.
                </p>
              </>
            )}
            {step >= 4 && (
              <>
                <dl className="sms-definition">
                  <dt>نام</dt>
                  <dd>{name}</dd>
                  <dt>نوع</dt>
                  <dd>تبلیغاتی</dd>
                  <dt>گروه</dt>
                  <dd>{group?.name || "نامشخص"}</dd>
                  <dt>قابل ارسال</dt>
                  <dd>{group ? faNumber(group.eligible_count) : "—"}</dd>
                  <dt>سقف گیرندگان</dt>
                  <dd>{faNumber(limit)}</dd>
                  <dt>زمان</dt>
                  <dd>
                    {schedule
                      ? new Date(schedule).toLocaleString("fa-IR")
                      : "پس از فعال‌سازی"}
                  </dd>
                  <dt>بخش پیامک برای هر نفر</dt>
                  <dd>{faNumber(estimate.parts)}</dd>
                </dl>
                <MessagePreview body={displayBody} parts={estimate.parts} />
                <p className="sms-alert">
                  ذخیرهٔ پیش‌نویس هیچ کمپینی را فعال نمی‌کند. فعال‌سازی نیازمند
                  اجازه و آماده‌بودن درگاه است.
                </p>
              </>
            )}
            <div className="sms-modal-actions">
              {step > 0 && (
                <button
                  className="sms-secondary"
                  disabled={busy}
                  onClick={() => {
                    setStep((v) => v - 1);
                    setFormError("");
                  }}
                >
                  مرحلهٔ قبل
                </button>
              )}
              {step < 5 ? (
                <button onClick={advance}>ادامه</button>
              ) : (
                <button
                  disabled={busy}
                  onClick={async () => {
                    const value = await act({
                      action: "create",
                      name,
                      groupId,
                      body,
                      tracking,
                      destination,
                      variantB,
                      tariff: tariff || null,
                      cooldownDays,
                      linkExpiresAt: linkExpires
                        ? new Date(linkExpires).toISOString()
                        : null,
                      maxRecipients: limit,
                      scheduledAt: schedule
                        ? new Date(schedule).toISOString()
                        : null,
                    });
                    if (value) {
                      setWizard(false);
                      setName("");
                      setBody("");
                      setSchedule("");
                      setStep(0);
                    }
                  }}
                >
                  {busy ? "در حال ذخیره…" : "ذخیره پیش‌نویس"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {confirmation && (
        <Modal
          title={
            confirmation.action === "cancel"
              ? "لغو کمپین"
              : "تأیید تغییر وضعیت کمپین"
          }
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation.action === "cancel"
              ? "این کمپین و پیام‌های باقی‌ماندهٔ آن در صف لغو شوند؟"
              : "این عملیات می‌تواند کمپین را وارد صف ارسال کند. شماره‌های لغو دریافت کنار گذاشته می‌شوند."}
          </p>
          <div className="sms-modal-actions">
            <button
              className="sms-secondary"
              onClick={() => setConfirmation(null)}
            >
              بازگشت
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                if (await act(confirmation)) setConfirmation(null);
              }}
            >
              تأیید
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
type Template = {
  code: string;
  category: string;
  body: string;
  enabled: number;
};
export function TemplatesPage() {
  const { notify, refresh, data } = useSms();
  const { resource, error, loading, reload } = useSmsResource<{
    templates: Template[];
  }>("/api/admin/sms/templates");
  const [editing, setEditing] = useState<Template | null>(null),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [q, setQ] = useState("");
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      await smsApi("/api/admin/sms/templates", payload);
      notify("قالب ذخیره شد.");
      reload();
      await refresh();
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Panel
        title="قالب‌های پیام"
        action={
          <button
            onClick={() => {
              setEditing({
                code: "",
                category: "transactional",
                body: "",
                enabled: 0,
              });
              setBody("");
            }}
          >
            قالب جدید
          </button>
        }
      >
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="جست‌وجوی شناسه یا متن قالب"
        />
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ResourceError message={error} retry={reload} />
        ) : resource?.templates.length ? (
          <div className="sms-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>نوع</th>
                  <th>متن و متغیرها</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {resource.templates
                  .filter((t) => (t.code + " " + t.body).includes(q))
                  .map((t) => (
                    <tr key={t.code}>
                      <td>
                        <bdi>{t.code}</bdi>
                      </td>
                      <td>
                        {t.category === "transactional"
                          ? "عملیاتی"
                          : "تبلیغاتی"}
                      </td>
                      <td>
                        <p className="sms-excerpt">{t.body}</p>
                        <small>
                          <bdi>
                            {(t.body.match(/\{\{[^}]+\}\}/g) || []).join(
                              "، ",
                            ) || "بدون متغیر"}
                          </bdi>
                        </small>
                      </td>
                      <td>
                        <span className="sms-badge">
                          {t.enabled ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="sms-quiet"
                          onClick={() => {
                            setEditing(t);
                            setBody(t.body);
                          }}
                        >
                          ویرایش و پیش‌نمایش
                        </button>
                        <button
                          className="sms-quiet"
                          disabled={
                            busy || (!t.enabled && !data.liveSendingEnabled)
                          }
                          onClick={() => {
                            if (
                              window.confirm(
                                t.enabled
                                  ? "قالب غیرفعال شود؟"
                                  : "قالب برای ساخت خودکار پیام فعال شود؟",
                              )
                            )
                              void act({
                                action: "toggle",
                                code: t.code,
                                confirm: t.enabled ? "DISABLE" : "ENABLE",
                              });
                          }}
                        >
                          {t.enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="قالبی ثبت نشده"
            text="متن‌های تکرارشونده را ذخیره کنید. قالب جدید خودکار فعال نمی‌شود."
          />
        )}
        <p className="sms-muted">
          ویرایش هر قالب آن را غیرفعال می‌کند. شناسه‌ها و نام متغیرهای متصل به
          رویدادهای سایت نباید تغییر کنند.
        </p>
      </Panel>
      {editing && (
        <Modal
          title={editing.code ? "ویرایش قالب" : "قالب جدید"}
          onClose={() => setEditing(null)}
        >
          <form
            className="sms-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const fields = new FormData(e.currentTarget);
              if (
                await act({
                  code: fields.get("code"),
                  category: fields.get("category"),
                  body,
                })
              )
                setEditing(null);
            }}
          >
            <Field label="شناسهٔ قالب">
              <input
                dir="ltr"
                name="code"
                required
                pattern="[a-z0-9_]{2,60}"
                defaultValue={editing.code}
                readOnly={!!editing.code}
              />
            </Field>
            <Field label="نوع قالب">
              <select name="category" defaultValue={editing.category}>
                <option value="transactional">عملیاتی</option>
                <option value="promotional">تبلیغاتی</option>
              </select>
            </Field>
            <Field label="متن قالب">
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                required
              />
            </Field>
            <div className="sms-variable-help">
              <p>
                برای پیام درخواست مشتری: <bdi>quote_received</bdi> و متغیر
                شمارهٔ درخواست <code>{"{{leadId}}"}</code>
              </p>
              <p>
                برای پرداخت تأییدشده: <bdi>payment_verified</bdi> و متغیر نام
                طرح <code>{"{{plan}}"}</code>
              </p>
              <p>
                پیش‌نمایش زیر متن خام قالب است؛ هیچ مقدار فرضی جای متغیرها قرار
                نمی‌گیرد.
              </p>
            </div>
            <MessagePreview body={body} parts={estimateSms(body).parts} />
            <button disabled={busy}>ذخیره به‌صورت غیرفعال</button>
          </form>
        </Modal>
      )}
    </>
  );
}
