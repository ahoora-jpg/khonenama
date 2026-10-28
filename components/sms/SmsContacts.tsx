"use client";
import { useState } from "react";
import {SmsCsvImport} from "./SmsCsvImport";
import { useSearchParams } from "next/navigation";
import { faNumber, kindLabels, smsDate } from "@/lib/sms-admin-ui";
import {
  EmptyState,
  Field,
  LoadingSkeleton,
  Modal,
  Pagination,
  Panel,
  ResourceError,
  SearchBox,
  smsApi,
  useSms,
  useSmsResource,
  type Contact,
} from "./SmsAdminShell";
type ContactPage = {
  items: Contact[];
  page: number;
  size: number;
  total: number;
};
type History = {
  contact: Contact;
  history: {
    status: string;
    method: string;
    text_version: string;
    evidence_ref: string;
    created_at: string;
  }[];
};
export function ConsentLabel({ status }: { status: string }) {
  return (
    <span
      className={`sms-badge sms-consent-${status === "revoked" ? "revoked" : "granted"}`}
    >
      {status === "revoked" ? "لغو دریافت" : "قابل ارسال"}
    </span>
  );
}
export function ContactsPage() {
  const { notify, refresh } = useSms();
  const params = useSearchParams();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState(params.get('filter')||""),
    [page, setPage] = useState(1),
    [modal, setModal] = useState<"new" | "edit" | "detail" | null>(
      params.get("new") === "1" ? "new" : null,
    ),
    [selected, setSelected] = useState<Contact | null>(null),
    [detail, setDetail] = useState<History | null>(null),
    [busy, setBusy] = useState(false);
  const { resource, error, loading, reload } = useSmsResource<ContactPage>(
    "/api/admin/sms/workspace?" +
      new URLSearchParams({ view: "contacts", q, filter, page: String(page) }),
  );
  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const result = await smsApi("/api/admin/sms", payload);
      notify(
        result.duplicate
          ? "این شماره قبلاً ثبت شده است؛ مخاطب تکراری ساخته نشد."
          : "اطلاعات ذخیره شد.",
      );
      setModal(null);
      reload();
      await refresh();
      return result;
    } catch (e) {
      notify((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function syncPublishedBusinesses() {
    setBusy(true);
    try {
      const result = await smsApi("/api/admin/sms", { action: "syncPublishedBusinesses" });
      notify(`${faNumber(result.synced || 0)} شمارهٔ غرفهٔ منتشرشده آمادهٔ ارسال پیام عملیاتی شد.`);
      reload();
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SmsCsvImport onImported={()=>{reload();}}/>
      <Panel>
        <div className="sms-filter-toolbar">
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="جست‌وجوی نام یا شماره همراه"
          />
          <label className="sms-filter-label">
            وضعیت دریافت
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">همه مخاطبان</option>
              <option value="active">قابل ارسال</option>
              <option value="revoked">لغو عضویت</option>
            </select>
          </label>
          <button
            onClick={() => {
              setSelected(null);
              setModal("new");
            }}
          >
            افزودن مخاطب
          </button>
          <button className="sms-secondary" disabled={busy} onClick={() => void syncPublishedBusinesses()}>
            همگام‌سازی غرفه‌ها
          </button>
          <a className="sms-button sms-secondary" href="/sms/groups">
            ورود از پرونده
          </a>
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ResourceError message={error} retry={reload} />
        ) : resource?.items.length ? (
          <>
            <div className="sms-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>شماره همراه</th>
                    <th>نوع</th>
                    <th>وضعیت دریافت</th>
                    <th>گروه‌ها</th>
                    <th>تاریخ ثبت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.items.map((c) => (
                    <tr key={c.id}>
                      <td>{c.display_name || "بدون نام"}</td>
                      <td>
                        <bdi>{c.phone_e164}</bdi>
                      </td>
                      <td>{kindLabels[c.kind] || "سایر"}</td>
                      <td>
                        <ConsentLabel status={c.consent_status} />
                      </td>
                      <td>{c.groups?.map((g) => g.name).join("، ") || "—"}</td>
                      <td>{smsDate(c.created_at)}</td>
                      <td>
                        <button className="sms-quiet sms-danger-text" disabled={busy} onClick={()=>{if(window.confirm('این شماره و نام از مرکز پیامک پاک شود؟ پیام‌های در صف لغو و متن‌های مرتبط پاک می‌شوند. آمار بدون شماره باقی می‌ماند و این شماره دوباره وارد ارسال نمی‌شود.'))void run({action:'removeContact',id:c.id});}}>حذف مخاطب</button>
                        <button
                          className="sms-quiet"
                          onClick={() => {
                            setSelected(c);
                            setModal("edit");
                          }}
                        >
                          ویرایش
                        </button>
                        <button
                          className="sms-quiet"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              setDetail(
                                await smsApi(
                                  "/api/admin/sms/workspace?view=contact&id=" +
                                    encodeURIComponent(c.id),
                                ),
                              );
                              setSelected(c);
                              setModal("detail");
                            } catch (e) {
                              notify((e as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          جزئیات
                        </button>
                      </td>
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
            title="مخاطبی پیدا نشد"
            text={
              q || filter
                ? "فیلتر یا عبارت جست‌وجو را تغییر دهید."
                : "مخاطب جدید ثبت کنید یا شماره‌ها را از پرونده وارد کنید."
            }
          />
        )}
      </Panel>
      <p className="sms-muted">
        شماره‌ها برای حفاظت از اطلاعات به‌صورت پوشانده‌شده نمایش داده می‌شوند.
        جست‌وجو روی شمارهٔ ثبت‌شده انجام می‌شود.
      </p>
      {(modal === "new" || modal === "edit") && (
        <Modal
          title={modal === "new" ? "مخاطب جدید" : "ویرایش مخاطب"}
          onClose={() => setModal(null)}
        >
          <form
            key={selected?.id || "new"}
            className="sms-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const fields = new FormData(e.currentTarget);
              await run({
                action: modal === "new" ? "contact" : "editContact",
                id: selected?.id,
                phone: fields.get("phone"),
                name: fields.get("name"),
                kind: fields.get("kind"),
              });
            }}
          >
            {modal === "new" ? (
              <Field label="شماره همراه">
                <input
                  name="phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  required
                  placeholder="0912…"
                />
              </Field>
            ) : (
              <p>
                شمارهٔ مخاطب: <bdi>{selected?.phone_e164}</bdi>
                <br />
                <small>برای شمارهٔ جدید، مخاطب جدا بسازید.</small>
              </p>
            )}
            <Field label="نام نمایشی">
              <input
                name="name"
                defaultValue={selected?.display_name || ""}
                maxLength={120}
              />
            </Field>
            <Field label="نوع مخاطب">
              <select name="kind" defaultValue={selected?.kind || "other"}>
                {Object.entries(kindLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <p className="sms-muted">شمارهٔ تکراری دوباره ثبت نمی‌شود.</p>
            <button disabled={busy}>
              {busy ? "در حال ثبت…" : "ذخیره مخاطب"}
            </button>
          </form>
          {modal==='new'&&<SmsCsvImport onImported={()=>{reload();setModal(null);}}/>}
        </Modal>
      )}
      {modal === "detail" && detail && (
        <Modal title="مشخصات مخاطب" onClose={() => setModal(null)}>
          <h3>{detail.contact.display_name || "بدون نام"}</h3>
          <p>
            <bdi>{detail.contact.phone_e164}</bdi> ·{" "}
            <ConsentLabel status={detail.contact.consent_status} />
          </p>
          <div className="sms-toolbar">
            {detail.contact.consent_status !== "revoked" && (
              <button
                className="sms-secondary"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("عضویت تبلیغاتی این مخاطب لغو شود؟"))
                    void run({
                      action: "consent",
                      contactId: detail.contact.id,
                      status: "revoked",
                      method: "admin_manual",
                      textVersion: "optout-v1",
                      evidenceRef: "admin_request:" + new Date().toISOString(),
                    });
                }}
              >
                لغو عضویت تبلیغاتی
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
type Group = {
  id: string;
  name: string;
  member_count: number;
  eligible_count: number;
};
type Groups = { groups: Group[]; members: Contact[]; memberLimit: number };
export function GroupsPage() {
  const { data, notify, refresh } = useSms();
  const [memberPage,setMemberPage]=useState(1);
  const [groupId, setGroupId] = useState(""),
    [modal, setModal] = useState<"new" | "edit" | null>(null),
    [busy, setBusy] = useState(false),
    [q, setQ] = useState(""),
    [memberId, setMemberId] = useState(""),
    [result, setResult] = useState("");
  const { resource, error, loading, reload } = useSmsResource<Groups>(
    "/api/admin/sms/workspace?view=groups&id=" + encodeURIComponent(groupId)+'&page='+memberPage,
  );
  const current = resource?.groups.find((g) => g.id === groupId);
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const value = await smsApi("/api/admin/sms/campaigns", payload);
      notify("عملیات گروه ثبت شد.");
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
  return (
    <>
      <Panel
        title="گروه‌های مخاطبان"
        action={<button onClick={() => setModal("new")}>گروه جدید</button>}
      >
        <SearchBox value={q} onChange={setQ} placeholder="جست‌وجوی نام گروه" />
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ResourceError message={error} retry={reload} />
        ) : resource?.groups.length ? (
          <div className="sms-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>گروه</th>
                  <th>اعضا</th>
                  <th>قابل ارسال</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {resource.groups
                  .filter((g) => g.name.includes(q))
                  .map((g) => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{faNumber(g.member_count)}</td>
                      <td>{faNumber(g.eligible_count)}</td>
                      <td>
                        <button
                          className="sms-quiet"
                          aria-pressed={g.id === groupId}
                          onClick={() => {
                            setGroupId(g.id);setMemberPage(1);
                            setResult("");
                          }}
                        >
                          مشاهده و مدیریت اعضا
                        </button>
                        <button
                          className="sms-quiet"
                          onClick={() => {
                            setGroupId(g.id);
                            setModal("edit");
                          }}
                        >
                          ویرایش نام
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="هنوز گروهی ندارید"
            text="برای سازمان‌دهی مخاطبان، یک گروه بسازید."
          />
        )}
        <p className="sms-muted">
          حداکثر ۵۰۰ گروه نمایش داده می‌شود. شماره‌های لغو دریافت در زمان ارسال
          کنار گذاشته می‌شوند.
        </p>
      </Panel>
      {!current&&<SmsCsvImport onImported={id=>{setGroupId(id);reload();}}/>}
      {current && (
        <Panel title={"اعضای " + current.name}>
          <div className="sms-filter-toolbar">
            <Field label="افزودن از ۱۰۰ مخاطب آخر">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="">انتخاب مخاطب</option>
                {data.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || "بدون نام"} · {c.phone_e164}
                  </option>
                ))}
              </select>
            </Field>
            <button
              disabled={!memberId || busy}
              onClick={() =>
                void act({ action: "member", groupId, contactId: memberId })
              }
            >
              افزودن به گروه
            </button>
          </div>
          <SmsCsvImport groupId={groupId} onImported={()=>{reload();}}/>
          {resource?.members.length ? (
            <div className="sms-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>شماره</th>
                    <th>وضعیت دریافت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.members.map((c) => (
                    <tr key={c.id}>
                      <td>{c.display_name || "بدون نام"}</td>
                      <td>
                        <bdi>{c.phone_e164}</bdi>
                      </td>
                      <td>
                        <ConsentLabel status={c.consent_status} />
                      </td>
                      <td>
                        <button
                          className="sms-quiet sms-danger-text"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm("این مخاطب از گروه حذف شود؟"))
                              void act({
                                action: "removeMember",
                                groupId,
                                contactId: c.id,
                              });
                          }}
                        >
                          حذف از گروه
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sms-muted">این گروه هنوز عضوی ندارد.</p>
          )}
          <p className="sms-muted">
            نمایش حداکثر ۲۰۰ عضو نخست؛ تعداد کل گروه در جدول بالا آمده است.
          </p>
        </Panel>
      )}
      {modal && (
        <Modal
          title={modal === "new" ? "ساخت گروه" : "ویرایش نام گروه"}
          onClose={() => setModal(null)}
        >
          <form
            className="sms-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = new FormData(e.currentTarget).get("name");
              const value = await act({
                action: modal === "new" ? "group" : "renameGroup",
                name,
                groupId,
              });
              if (value) {
                if (value.id) setGroupId(value.id);
                setModal(null);
              }
            }}
          >
            <Field label="نام گروه">
              <input
                name="name"
                defaultValue={modal === "edit" ? current?.name : ""}
                maxLength={100}
                required
              />
            </Field>
            <button disabled={busy}>ذخیره گروه</button>
          </form>
        </Modal>
      )}
    </>
  );
}
