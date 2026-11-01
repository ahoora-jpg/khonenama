"use client";
import { useRef, useState } from "react";
import {RetryAction} from "./SmsCommandCenter";
import { useSearchParams } from "next/navigation";
import { estimateSms } from "@/lib/sms-text";
import { faNumber, smsDate, stateLabels } from "@/lib/sms-admin-ui";
import {
  Badge,
  EmptyState,
  Field,
  GatewayStatus,
  LoadingSkeleton,
  MessagePreview,
  Modal,
  Pagination,
  Panel,
  ResourceError,
  SearchBox,
  smsApi,
  useSms,
  useSmsResource,
  type SmsMessage,
} from "./SmsAdminShell";
export function SendPage() {
  const { data, refresh, notify } = useSms();
  const [contactId, setContactId] = useState(""),
    [body, setBody] = useState(""),
    [category, setCategory] = useState("transactional"),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  const contact = data.contacts.find((c) => c.id === contactId),
    estimate = estimateSms(body);
  const eligible =
    category !== "promotional" ||
    Boolean(contact && contact.consent_status !== "revoked");
  return (
    <div className="sms-compose-layout">
      <Panel title="نگارش پیام">
        <form
          className="sms-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            key.current ??= crypto.randomUUID();
            try {
              const result = await smsApi("/api/admin/sms", {
                action: "queue",
                draftOnly:
                  (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
                    "value",
                  ) === "draft",
                contactId,
                body,
                category,
                reason,
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
                idempotencyKey: key.current,
              });
              notify(
                result.status === "draft"
                  ? "پیش‌نویس ذخیره شد؛ پیامی ارسال نشده است."
                  : "پیام در صف ثبت شد؛ تحویل هنوز تأیید نشده است.",
              );
              setBody("");
              setReason("");
              key.current = null;
              await refresh();
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field
            label="گیرنده"
            hint="۱۰۰ مخاطب آخر؛ برای جست‌وجوی کامل از صفحهٔ مخاطبان استفاده کنید."
          >
            <select
              required
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">انتخاب مخاطب</option>
              {data.contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name || "بدون نام"} · {c.phone_e164}
                </option>
              ))}
            </select>
          </Field>
          <Field label="نوع پیام">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="transactional">عملیاتی</option>
              <option value="promotional">تبلیغاتی</option>
            </select>
          </Field>
          {category === "transactional" && (
            <Field
              label="دلیل ارسال عملیاتی"
              hint="مانند پاسخ به درخواست یا پیگیری سفارش"
            >
              <input
                value={reason}
                maxLength={120}
                required
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          )}
          <Field label="متن پیام">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              required
              rows={7}
            />
          </Field>
          <div className="sms-counter">
            <span>{faNumber(body.length)} از ۱۰۰۰ نویسه</span>
            <span>
              {faNumber(estimate.parts)} بخش ·{" "}
              {estimate.encoding === "unicode"
                ? "یونیکد"
                : "نویسه‌های استاندارد"}
            </span>
          </div>
          {category === "promotional" && !eligible && (
            <p role="status" className="sms-alert">
              مخاطب را انتخاب کنید. شماره‌هایی که لغو دریافت کرده‌اند در ارسال
              تبلیغاتی کنار گذاشته می‌شوند.
            </p>
          )}
          <div className="sms-modal-actions">
            {data.liveSendingEnabled && (
              <button
                type="submit"
                value="draft"
                className="sms-secondary"
                disabled={busy}
              >
                ذخیره پیش‌نویس
              </button>
            )}
            <button
              type="submit"
              value={data.liveSendingEnabled ? "queue" : "draft"}
              disabled={busy || (data.liveSendingEnabled && !eligible)}
            >
              {busy
                ? "در حال ثبت…"
                : data.liveSendingEnabled
                  ? "ثبت در صف ارسال"
                  : "ذخیره پیش‌نویس"}
            </button>
          </div>
        </form>

      </Panel>
      <div>
        <Panel>
          <MessagePreview body={body} parts={estimate.parts} />
          <dl className="sms-definition">
            <dt>تعداد گیرندگان</dt>
            <dd>{contactId ? "۱" : "۰"}</dd>
            <dt>وضعیت دریافت تبلیغات</dt>
            <dd>
              {contact && contact.consent_status !== "revoked"
                ? "قابل ارسال"
                : contact
                  ? "لغو دریافت"
                  : "مخاطب انتخاب نشده"}
            </dd>
            <dt>زمان‌بندی پیام دستی</dt>
            <dd>در این نسخه پشتیبانی نمی‌شود</dd>
          </dl>
        </Panel>
        <Panel title="وضعیت درگاه">
          <GatewayStatus />
        </Panel>
      </div>
    </div>
  );
}
type PageData = {
  items: (SmsMessage & { sender_e164?: string; received_at?: string })[];
  total: number;
  page: number;
  size: number;
};
type Detail = {
  message: SmsMessage;
  events: { state: string; detail: string; created_at: string }[];
};
export function HistoryPage({ inbound = false, failed = false }: { inbound?: boolean; failed?:boolean }) {
  const { notify, refresh } = useSms();
  const params = useSearchParams();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState(failed?"failed":params.get("status") || ""),
    [page, setPage] = useState(1),
    [detail, setDetail] = useState<Detail | null>(null),
    [busy, setBusy] = useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const query = new URLSearchParams({
    view: inbound ? "inbox" : "history",
    q,
    filter,
    page: String(page),
    ...(params.get("campaignId")?{campaignId:params.get("campaignId")!}:{}),
  });
  const { resource, error, loading, reload } = useSmsResource<PageData>(
    "/api/admin/sms/workspace?" + query,
  );
  return (
    <>
      <Panel>
        <div className="sms-filter-toolbar">
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="جست‌وجوی شماره یا متن پیام"
          />
          {!inbound && !failed && (
            <label className="sms-filter-label">
              وضعیت
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">همه وضعیت‌ها</option>
                {Object.entries({...stateLabels,sending:"در حال ارسال"})
                  .filter(
                    ([s]) =>
                      !["approved", "running", "paused", "completed","leased","submitted","processed","sent"].includes(
                        s,
                      ),
                  )
                  .map(([s, label]) => (
                    <option value={s} key={s}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
        {failed && <div className="sms-command-actions"><label><input type="checkbox" checked={Boolean(resource?.items.length) && resource!.items.every(m=>selected.includes(m.id))} onChange={e=>setSelected(e.target.checked?(resource?.items||[]).map(m=>m.id):[])} /> انتخاب این صفحه</label><RetryAction ids={selected} onDone={()=>{setSelected([]);reload();}}>تلاش مجدد موارد انتخاب‌شده</RetryAction></div>}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ResourceError message={error} retry={reload} />
        ) : resource?.items.length ? (
          <>
            <div className="sms-table-scroll sms-history-table">
              <table>
                <thead>
                  <tr>
                    {failed && <th>انتخاب</th>}<th>{inbound ? "فرستنده" : "گیرنده"}</th>
                    <th>متن</th>
                    {!inbound && (
                      <>
                        <th>نوع</th>
                        <th>وضعیت</th>
                      </>
                    )}
                    <th>زمان ثبت</th>
                    {!inbound && (
                      <>
                        <th>آخرین تغییر</th>
                        <th>عملیات</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {resource.items.map((m) => (
                    <tr key={m.id}>
                      {failed && <td><input aria-label={"انتخاب پیام " + m.id} type="checkbox" checked={selected.includes(m.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,m.id]:v.filter(id=>id!==m.id))}/></td>}
                      <td data-label={inbound?"فرستنده":"گیرنده"}>
                        <bdi>{inbound ? m.sender_e164 : m.phone_e164}</bdi>
                      </td>
                      <td data-label="متن" className="sms-excerpt">
                        {m.body || "محتوا پاک‌سازی شده است"}
                      </td>
                      {!inbound && (
                        <>
                          <td>
                            {m.category === "promotional"
                              ? "تبلیغاتی"
                              : "عملیاتی"}
                          </td>
                          <td data-label="وضعیت">
                            <Badge state={m.status} />
                          </td>
                        </>
                      )}
                      <td data-label="زمان ثبت">{smsDate(inbound ? m.received_at : m.created_at)}</td>
                      {!inbound && (
                        <>
                          <td>{smsDate(m.updated_at)}</td>
                          <td data-label="عملیات">
                            <button
                              className="sms-quiet"
                              disabled={busy}
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  setDetail(
                                    await smsApi("/api/admin/sms/" + m.id),
                                  );
                                } catch (e) {
                                  notify((e as Error).message);
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              جزئیات
                            </button>
                            {m.status==='failed' && <RetryAction ids={[m.id]} onDone={reload}/> }
                            {m.status==='unknown' && <small>وضعیت ارسال قطعی نیست؛ ارسال دوباره ممکن است باعث دریافت تکراری شود.</small>}
                            {["draft", "queued"].includes(m.status) && (
                              <button
                                className="sms-quiet sms-danger-text"
                                disabled={busy}
                                onClick={async () => {
                                  if (!window.confirm("این پیام لغو شود؟"))
                                    return;
                                  setBusy(true);
                                  try {
                                    await smsApi("/api/admin/sms", {
                                      action: "cancel",
                                      id: m.id,
                                    });
                                    notify("پیام لغو شد.");
                                    reload();
                                    await refresh();
                                  } catch (e) {
                                    notify((e as Error).message);
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                لغو پیام
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={resource.total}
              size={resource.size}
              onChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title={inbound ? "پیام دریافتی پیدا نشد" : "پیامی پیدا نشد"}
            text={
              q || filter
                ? "عبارت جست‌وجو یا فیلتر را تغییر دهید."
                : inbound
                  ? "پس از اتصال امن گوشی و فعال‌سازی دریافت، پیام‌ها اینجا دیده می‌شوند."
                  : "از صفحهٔ ارسال پیامک، اولین پیش‌نویس را بسازید."
            }
            href={inbound ? "/sms/gateway" : "/sms/send"}
            action={inbound ? "وضعیت اتصال" : "نگارش پیام"}
          />
        )}
      </Panel>
      {!inbound && (
        <p className="sms-muted">
          پذیرش گوشی، ارسال و تحویل جدا هستند. برای وضعیت نامشخص، ارسال مجدد
          خودکار انجام نمی‌شود.
        </p>
      )}
      {detail && (
        <Modal title="جزئیات پیام و تاریخچه" onClose={() => setDetail(null)}>
          <p className="sms-message-body">
            {detail.message.body || "متن طبق سیاست نگهداری پاک‌سازی شده است."}
          </p>
          <dl className="sms-definition">
            <dt>گیرنده</dt>
            <dd>
              <bdi>{detail.message.phone_e164}</bdi>
            </dd>
            <dt>وضعیت دقیق فنی</dt><dd><bdi>{detail.message.status}</bdi></dd>
            <dt>وضعیت فعلی</dt>
            <dd>
              <Badge state={detail.message.status} />
            </dd>
            <dt>شناسهٔ درگاه</dt>
            <dd>
              <bdi>{detail.message.gateway_message_id || "هنوز ثبت نشده"}</bdi>
            </dd>
          </dl>
          <ol className="sms-timeline">
            {detail.events.map((event, i) => (
              <li key={i}>
                <Badge state={event.state} />
                <time>{smsDate(event.created_at)}</time>
              </li>
            ))}
          </ol>
          {!detail.events.length && <p>رویدادی ثبت نشده است.</p>}
        </Modal>
      )}
    </>
  );
}
