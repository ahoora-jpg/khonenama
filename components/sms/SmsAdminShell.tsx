"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { LayoutDashboard, Send, Users, FolderOpen } from "lucide-react";
import {
  Menu,
  X,
  RefreshCw,
  LogOut,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Smartphone,
  Settings,
  FileText,
  Inbox,
  ListChecks,
  Megaphone,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
} from "lucide-react";
import {
  bridgeLabels,
  bridgeState,
  smsPages,
  smsDate,
  stateLabels,
  faNumber,
  type SmsPageKey,
} from "@/lib/sms-admin-ui";

export type Contact = {
  id: string;
  phone_e164: string;
  display_name: string;
  kind: string;
  source?: string;
  consent_status: string;
  created_at?: string;
  groups?: { id: string; name: string }[];
};
export type SmsMessage = {
  id: string;
  phone_e164: string;
  category: string;
  status: string;
  body: string;
  created_at: string;
  updated_at?: string;
  gateway_message_id?: string | null;
};
export type Dashboard = {
  counts: { status: string; count: number }[];
  contacts: Contact[];
  messages: SmsMessage[];
  control?: {paused:number;revision:number;updated_at:string|null};
  campaigns: {
    id: string;
    name: string;
    status: string;
    scheduled_at: string | null;
    audience?:number; total?:number; queued?:number; delivered?:number; failed?:number; sending?:number;
  }[];
  agent: {
    last_seen_at: string | null;
    last_inbox_at?:string|null;
    last_error: string | null;
    enabled: number;
    gateway_enabled: number;
    sim_number: number;
    sim_selection?: 2 | "default" | null;
    inbound_enabled: number;
  } | null;
  summary: {
    contact_count?: number;
    active_campaigns: number;
    opt_outs: number;
    priority_queued: number;
    consented_contacts: number;
  };
  liveSendingEnabled: boolean;
  setup: {
    separateKeyConfigured: boolean;
    bridgeCredentialConfigured: boolean;
  };
};
type ContextValue = {
  data: Dashboard;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  revision: number;
};
export const SmsAdminContext = createContext<ContextValue | null>(null);
const Context = SmsAdminContext;
export function useSms() {
  const value = useContext(Context);
  if (!value) throw Error("SMS_CONTEXT_REQUIRED");
  return value;
}
const icons = [
  BarChart3,
  Users,
  LayoutDashboard,
  Send,
  Users,
  FolderOpen,
  Megaphone,
  FileText,
  Inbox,
  ListChecks,
  BarChart3,
  Smartphone,
  Settings,
];
export async function smsApi(path: string, payload?: Record<string, unknown>) {
  const response = await fetch(path, {
    cache: "no-store",
    ...(payload
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    const labels: Record<string, string> = {
      RETRY_PREVIEW_CHANGED:'شرایط پیام‌ها تغییر کرده؛ دوباره بازبینی کنید.',
      RETRY_BATCH_LIMIT:'در هر نوبت حداکثر ۵۰ پیام انتخاب کنید.',
      CONTROL_UNAVAILABLE:'کنترل ارسال در دسترس نیست؛ وضعیت قبلی حفظ شده است.',
      CONTACT_REMOVED:'این شماره حذف شده است و دوباره برای ارسال اضافه نمی‌شود.',
      CONTACT_BUSY:'پیامی در اختیار گوشی است؛ پس از مشخص‌شدن نتیجه دوباره حذف کنید.',
      INVALID_TRACKING_OPTIONS:'مقصد، انقضا، تعرفه یا فاصله ارسال معتبر نیست.',
      REGISTRATION_LINK_REQUIRED:'متغیر لینک اختصاصی را در تمام نسخه‌های متن قرار دهید.',
      UNRESOLVED_VARIABLE:'متن پیام دارای متغیر ناشناخته یا لینک فعال‌نشده است.',
      INVALID_PHONE: "شماره همراه معتبر نیست.",
      INVALID_MESSAGE: "متن، مخاطب و دلیل پیام را بررسی کنید.",
      RECIPIENT_OPTED_OUT:
        "این مخاطب لغو دریافت کرده است و پیام تبلیغاتی برایش ارسال نمی‌شود.",
      LIVE_SEND_DISABLED: "ارسال واقعی غیرفعال است.",
      INVALID_SCHEDULE: "زمان شروع باید در آینده باشد.",
      DUPLICATE_PHONE: "این شماره قبلاً ثبت شده است.",
      CANNOT_CANCEL: "این پیام دیگر قابل لغو نیست.",
      IDEMPOTENCY_CONFLICT:
        "درخواست قبلی با همین شناسه متفاوت است. صفحه را تازه کنید.",
      INVALID_DATE_RANGE: "بازهٔ تاریخ باید معتبر و حداکثر یک سال باشد.",
    };
    const failure=new Error(
      response.status === 401
        ? "نشست شما منقضی شده است؛ دوباره وارد شوید."
        : labels[result.error] ||
            "عملیات انجام نشد؛ اطلاعات را بررسی و دوباره تلاش کنید.",
    );
    Object.assign(failure,{status:response.status});throw failure;
  }
  return result;
}
export function SmsAdminShell({
  page,
  children,
}: {
  page: SmsPageKey;
  children: ReactNode;
}) {
  const [data, setData] = useState<Dashboard | null>(null),
    [auth, setAuth] = useState("loading"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [revision, setRevision] = useState(0);
  const [drawer, setDrawer] = useState(false),
    [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const drawerRef = useRef<HTMLElement>(null),
    menuRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const activePage = ['groups','prospects'].includes(page)?'contacts':['send','history','inbox','templates'].includes(page)?'messages':page==='settings'?'gateway':page==='acquisition'?'campaigns':page;
  const current = smsPages.find((item) => item.key === activePage)!;
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/sms/session", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setData(null);
        setAuth("site");
        return;
      }
      if (!response.ok) throw Error("بررسی دسترسی انجام نشد.");
      const session = await response.json();
      if (!session.authenticated) {
        setData(null);
        setAuth("sms");
        return;
      }
      const next = await smsApi("/api/admin/sms");
      setData(next);
      setAuth("ready");
      setError("");
      setRevision((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
      setAuth((value) => (value === "ready" ? value : "error"));
    } finally {
      setBusy(false);
    }
    // Keep the previous snapshot visible when a refresh fails.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void refresh();
    const poll=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},30000);
    return ()=>clearInterval(poll);
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const menu = accountRef.current;
      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      )
        menu.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && accountRef.current?.open) {
        accountRef.current.open = false;
        accountRef.current.querySelector<HTMLElement>("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        menuRef.current?.focus();
      }
      if (e.key === "Tab") {
        const nodes =
          drawerRef.current?.querySelectorAll<HTMLElement>("a,button");
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [drawer]);
  const status = bridgeState(data?.agent || null, now);
  return (
    <div dir="rtl" className={`sms-app${collapsed ? " sms-collapsed" : ""}`}>
      <a href="#sms-content" className="sms-skip">
        رفتن به محتوای اصلی
      </a>
      {drawer && (
        <button
          type="button"
          className="sms-backdrop"
          aria-label="بستن فهرست"
          tabIndex={-1}
          onClick={() => {
            setDrawer(false);
            menuRef.current?.focus();
          }}
        />
      )}
      <aside
        ref={drawerRef}
        className={`sms-sidebar${drawer ? " is-open" : ""}`}
        aria-label="راهبری مرکز پیامک"
        {...(drawer ? { role: "dialog", "aria-modal": true } : {})}
      >
        <div className="sms-brand">
          <img className="sms-brand-image" src="/sms-assets/logo.webp" width={52} height={52} alt="نشان مرکز پیامک خونه‌نما" />
          <div>
            <strong>خونه‌نما</strong>
            <small>مرکز پیامک</small>
          </div>
          <button
            className="sms-mobile-only sms-icon-button"
            aria-label="بستن فهرست"
            onClick={() => {
              setDrawer(false);
              menuRef.current?.focus();
            }}
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="بخش‌های پنل">
          {smsPages.filter(item=>['dashboard','campaigns','contacts','messages'].includes(item.key)).sort((a,b)=>['dashboard','campaigns','contacts','messages'].indexOf(a.key)-['dashboard','campaigns','contacts','messages'].indexOf(b.key)).map((item) => {
            const Icon = {dashboard:LayoutDashboard,campaigns:Megaphone,contacts:Users,messages:MessageSquare}[item.key as 'dashboard'|'campaigns'|'contacts'|'messages'];
            return (
              <Link
                key={item.key}
                href={item.path}
                className={activePage === item.key ? "is-active" : ""}
                aria-current={activePage === item.key ? "page" : undefined}
                title={item.title}
                onClick={() => setDrawer(false)}
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sms-sidebar-bottom">
          <nav aria-label="گزارش و تنظیمات"><Link href="/sms/reports">گزارش‌ها</Link><Link href="/sms/gateway">اتصال و تنظیمات</Link></nav>
          <div className="sms-account">
            <span>م</span>
            <div>
              <strong>مدیریت خونه‌نما</strong>
              <small>دسترسی مدیریتی</small>
            </div>
          </div>
          <button
            className="sms-quiet sms-collapse-button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "بازکردن منو" : "جمع‌کردن منو"}
          >
            {collapsed ? (
              <PanelRightOpen size={18} />
            ) : (
              <PanelRightClose size={18} />
            )}
            <span>جمع‌کردن منو</span>
          </button>
        </div>
      </aside>
      <div className="sms-main" inert={drawer}>
        <header className="sms-topbar">
          <div className="sms-top-title">
            <button
              ref={menuRef}
              className="sms-mobile-only sms-icon-button"
              aria-label="بازکردن فهرست"
              aria-expanded={drawer}
              onClick={() => setDrawer(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <small>
                مرکز پیامک <ChevronLeft size={12} /> {current.title}
              </small>
              <strong>{current.title}</strong>
            </div>
          </div>
          <div className="sms-top-actions">
            <span className={`sms-connection sms-${status}`}>
              <i />
              {bridgeLabels[status]}
            </span>
            <button
              className="sms-icon-button"
              aria-label="به‌روزرسانی اطلاعات"
              disabled={busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={18} />
            </button>
            <details
              ref={accountRef}
              className="sms-user-menu"
              onClick={(event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest("a") &&
                  accountRef.current
                )
                  accountRef.current.open = false;
              }}
            >
              <summary aria-label="حساب مدیریت">م</summary>
              <div>
                <strong>مدیریت خونه‌نما</strong>
                <Link href="/sms/settings">تنظیمات دسترسی</Link>
                <button
                  className="sms-quiet"
                  onClick={async () => {
                    try {
                      await smsApi("/api/admin/sms/logout", {});
                      window.location.href = "/sms/login";
                    } catch (e) {
                      setToast((e as Error).message);
                    }
                  }}
                >
                  <LogOut size={16} /> خروج از پنل
                </button>
              </div>
            </details>
          </div>
        </header>
        <main id="sms-content" className="sms-content">
          <div className="sms-page-heading">
            <div>
              <h1>{current.title}</h1>
              <p>{current.description}</p>
            </div>
            {activePage !== "dashboard" && activePage !== "messages" && (
              <Link href="/sms/send" className="sms-button">
                <Plus size={17} /> پیامک جدید
              </Link>
            )}
          </div>
          {error && (
            <p role="alert" className="sms-alert sms-error">
              {error}{" "}
              <button onClick={() => void refresh()}>تلاش دوباره</button>
            </p>
          )}
          {auth === "loading" && <LoadingSkeleton />}
          {auth === "site" && (
            <EmptyState
              title="ابتدا وارد پنل شوید"
              text="این بخش فقط برای مدیر خونه‌نما قابل دسترسی است."
              href="/sms/login"
              action="ورود مدیر"
            />
          )}
          {auth === "sms" && (
            <section className="sms-panel">
              <h2>تأیید دسترسی اختصاصی</h2>
              <p>محافظت اضافی مرکز پیامک فعال است.</p>
              <form
                className="sms-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  try {
                    await smsApi("/api/admin/sms/login", {
                      key: String(new FormData(form).get("key") || ""),
                    });
                    form.reset();
                    await refresh();
                  } catch (e) {
                    setToast((e as Error).message);
                  }
                }}
              >
                <Field label="کلید اختصاصی مرکز پیامک">
                  <input
                    name="key"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </Field>
                <button>ورود</button>
              </form>
            </section>
          )}
          {data && auth === "ready" && (
            <Context.Provider
              value={{ data, refresh, notify: setToast, revision }}
            >
              {!data.liveSendingEnabled && (
                <div className="sms-safety-note">
                  <span className="sms-dot" />
                  <span>
                    <strong>ارسال واقعی خاموش است.</strong> اطلاعات و
                    پیش‌نویس‌ها در سامانه ذخیره می‌شوند؛ هیچ پیامی ارسال
                    نمی‌شود.
                  </span>
                  <Link href="/sms/gateway">
                    وضعیت اتصال <ChevronLeft size={14} />
                  </Link>
                </div>
              )}
              {children}
            </Context.Provider>
          )}
        </main>
        <footer className="sms-footer">
          مرکز پیامک خونه‌نما <span>نمایش زمان‌ها به وقت تهران</span>
        </footer>
      </div>
      {toast && (
        <div className="sms-toast" role="status">
          {toast}
          <button
            className="sms-icon-button"
            aria-label="بستن پیام"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
export function Panel({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="sms-panel">
      {title && (
        <header className="sms-panel-heading">
          <h2>{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="sms-empty">
      <MessageSquare size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="sms-button" href={href}>
          {action}
        </Link>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="sms-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Badge({ state }: { state: string }) {
  return (
    <span className={`sms-badge sms-state-${state}`}>
      {stateLabels[state] || "نامشخص"}
    </span>
  );
}
export function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: number | null;
  hint?: string;
  href?:string;
}) {
  const card=(
    <article className="sms-stat">
      <span className="sms-stat-icon">
        <MessageSquare size={19} />
      </span>
      <span>{title}</span>
      <strong>{value === null ? "—" : faNumber(value)}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
  return href?<Link href={href} aria-label={'مشاهده '+title}>{card}</Link>:card;
}
export function LoadingSkeleton() {
  return (
    <div className="sms-skeleton" role="status">
      <span>در حال دریافت اطلاعات…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
export function Pagination({
  page,
  total,
  size,
  onChange,
}: {
  page: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="sms-pagination">
      <span>
        {faNumber(total)} مورد · صفحهٔ {faNumber(page)} از{" "}
        {faNumber(Math.max(1, Math.ceil(total / size)))}
      </span>
      <div>
        <button
          className="sms-quiet"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronRight size={16} /> قبلی
        </button>
        <button
          className="sms-quiet"
          disabled={page * size >= total}
          onClick={() => onChange(page + 1)}
        >
          بعدی <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "جست‌وجو",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="sms-search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      className="sms-modal"
      aria-labelledby={titleId}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="sms-icon-button"
          aria-label="بستن پنجره"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function MessagePreview({
  body,
  parts,
}: {
  body: string;
  parts: number;
}) {
  return (
    <div className="sms-preview">
      <span>پیش‌نمایش پیام</span>
      <div>{body || "متن پیام شما اینجا نمایش داده می‌شود."}</div>
      <small>{faNumber(parts)} بخش پیامک · برآورد هزینه در دسترس نیست</small>
    </div>
  );
}
export function GatewayStatus() {
  const { data } = useSms();
  const state = bridgeState(data.agent);
  return (
    <dl className="sms-definition">
      <dt>درگاه گوشی</dt>
      <dd>{data.agent?.gateway_enabled ? "فعال" : "غیرفعال"}</dd>
      <dt>عامل ویندوز</dt>
      <dd>{bridgeLabels[state]}</dd>
      <dt>آخرین ارتباط عامل</dt>
      <dd>{smsDate(data.agent?.last_seen_at)}</dd>
      <dt>سیم‌کارت مجاز</dt>
      <dd>
        {data.agent?.sim_selection === "default" ? "پیش‌فرض گوشی" : data.agent?.sim_number === 2 ? "سیم‌کارت دوم" : "پیکربندی تأیید نشده"}
      </dd>
      <dt>پیام‌های در صف</dt>
      <dd>
        {faNumber(data.counts.find((c) => c.status === "queued")?.count || 0)}
      </dd>
      <dt>ارسال واقعی</dt>
      <dd>
        {data.liveSendingEnabled
          ? "مجاز در نرم‌افزار؛ نیازمند درگاه فعال"
          : "خاموش"}
      </dd>
    </dl>
  );
}
export function useSmsResource<T>(url: string) {
  const { revision } = useSms();
  const [resource, setResource] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    smsApi(url)
      .then((value) => {
        if (active) setResource(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url, revision, reload]);
  return { resource, error, loading, reload: () => setReload((v) => v + 1) };
}
export function ResourceError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div role="alert" className="sms-alert sms-error">
      {message}
      <button onClick={retry}>تلاش دوباره</button>
    </div>
  );
}
