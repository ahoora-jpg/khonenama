"use client";

import BusinessLogoutButton from "@/components/BusinessLogoutButton";
import BusinessWelcomeTrial from "@/components/BusinessWelcomeTrial";
import BusinessPublicationPanel from "@/components/BusinessPublicationPanel";
import BusinessPublicLinkCard from "@/components/BusinessPublicLinkCard";
import PreparedStoryStudio from "@/components/PreparedStoryStudio";
import BusinessInstallmentToggle from "@/components/BusinessInstallmentToggle";
import BusinessMediaManager from "@/components/BusinessMediaManager";
import BusinessLeadInbox from "@/components/BusinessLeadInbox";
import BusinessBrowserNotifications from "@/components/BusinessBrowserNotifications";
import BusinessReviewPanel from "@/components/BusinessReviewPanel";
import BusinessAnalyticsPanel from "@/components/BusinessAnalyticsPanel";
import BusinessVisibilitySettings from "@/components/BusinessVisibilitySettings";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BadgeCheck,
  Bell,
  CreditCard,
  Eye,
  FileText,
  ImagePlus,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

type StoredProfile = {
  ownerName?: string;
  businessName?: string;
  city?: string;
  area?: string;
  address?: string;
  description?: string;
  services?: string[];
  serviceAreas?: string[];
  status?: string;
  moderationReason?: string;
  verificationStatus?: string;
  completion?: number;
  plan?: string;
  planEndsAt?: string | null;
  leadCount?: number;
  businessSlug?: string;
  mediaCount?: number;
  phoneVerified?: boolean;
};

const nav = [
  ["نمای غرفه و تصاویر", "#media", ImagePlus],
  ["نمای کلی", "#overview", Store],
  ["اطلاعات پروفایل", "#profile", FileText],
  ["خدمات و محدوده", "#services", MapPin],
  ["درخواست‌های مشتری", "#leads", MessageCircle],
  ["نظرها", "#reviews", BadgeCheck],
  ["آمار", "#analytics", BarChart3],
  ["قالب استوری و لینک غرفه", "#public-link", Sparkles],
  ["اشتراک و پرداخت", "/dashboard/billing", CreditCard],
  ["تنظیمات", "#settings", Settings],
] as const;

export default function BusinessDashboardContent() {
  const [activeSection, setActiveSection] = useState("media");
  useEffect(() => {
    const sync = () => { const hash = window.location.hash.slice(1); setActiveSection(["media","overview","profile","services","leads","reviews","analytics","settings","public-link"].includes(hash) ? hash : "media"); };
    sync(); window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const sectionStyle = (key: string) => ({ display: activeSection === key ? undefined : "none" });
  const [profile, setProfile] = useState<StoredProfile>({});
  const [source, setSource] = useState<"server" | "browser" | "loading">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/me/business", { cache: "no-store" });
        if (response.status === 401) {
          window.location.replace("/business/login?next=/dashboard");
          return;
        }
        if (response.ok) {
          const result = await response.json();
          if (!cancelled && result?.ok && result.business) {
            const business = result.business;
            setProfile({
              ownerName: result.owner?.fullName || "",
              businessName: business.name || "",
              city: business.city || "",
              area: business.area || "",
              address: business.address || "",
              description: business.description || "",
              services: Array.isArray(business.services) ? business.services.map((item: any) => item.name) : [],
              serviceAreas: Array.isArray(business.serviceAreas) ? business.serviceAreas.map((item: any) => item.area).filter(Boolean) : [],
              status: business.status,
              moderationReason: business.moderation?.reason || "",
              verificationStatus: business.verification_status,
              completion: business.completion,
              plan: business.plan?.code || "free",
              planEndsAt: business.plan?.ends_at || null,
              leadCount: business.leadCount || 0,
              businessSlug: business.slug,
              mediaCount: Number(business.mediaCount || 0),
              phoneVerified: Boolean(result.owner?.phoneVerified),
            });
            setSource("server");
            return;
          }
        }
      } catch {}

      try {
        const raw = localStorage.getItem("khonenama-business-profile") || localStorage.getItem("khonenama-business-draft");
        if (raw && !cancelled) {
          setProfile(JSON.parse(raw));
          setSource("browser");
          return;
        }
      } catch {}

      if (!cancelled) setSource("browser");
    }

    loadProfile();
    window.addEventListener("khonenama-business-updated", loadProfile);
    return () => {
      cancelled = true;
      window.removeEventListener("khonenama-business-updated", loadProfile);
    };
  }, []);

  const completion = profile.completion ?? (profile.businessName ? 58 : 22);
  const displayName = profile.businessName || "کسب‌وکار شما";
  const location = [profile.city, profile.area].filter(Boolean).join("، ") || "محدوده ثبت نشده";
  const services = profile.services || [];
  const planLabel =
    profile.plan === "premium" ? "ویژه" :
    profile.plan === "pro" ? "حرفه‌ای" :
    "پایه";

  const nextTasks = useMemo(() => {
    const tasks = [
      { label: "تأیید شماره همراه", done: Boolean(profile.phoneVerified) },
      { label: "ثبت شهر و محدوده فعالیت", done: Boolean(profile.city && profile.serviceAreas?.length) },
      { label: "افزودن تصاویر نمونه‌کار (تکمیل اختیاری)", done: Number(profile.mediaCount || 0) >= 1 },
      { label: "ثبت خدمات اصلی", done: services.length > 0 },
    ];
    return tasks;
  }, [profile, services.length]);

  return (
    <div className="business-dashboard-shell">
      <BusinessWelcomeTrial />
      <aside className="business-dashboard-nav glass-panel">
        <div className="dashboard-business-mini">
          <span className="dashboard-business-avatar"><Store size={20} /></span>
          <div>
            <strong>{displayName}</strong>
            <small>{location}</small>
            <a href="/dashboard/billing" className={"dashboard-plan-badge plan-" + (profile.plan || "free")}>پلن {planLabel}</a>
          </div>
        </div>

        <nav>
          {nav.map(([label, href, Icon], index) => (
            <a className={href === "#" + activeSection ? "is-active" : ""} aria-current={href === "#" + activeSection ? "page" : undefined} href={href} key={label}>
              <Icon size={17} /><span>{label}</span>
            </a>
          ))}
        </nav>

        <a className="dashboard-upgrade-box" href="/dashboard/billing">
          <Sparkles size={18} />
          <strong>ارتقای پروفایل</strong>
          <small>آمار، تبلیغات و امکانات حرفه‌ای</small>
        </a>
        <BusinessLogoutButton />
      </aside>

      <div className="business-dashboard-main">
        <div className="dashboard-heading" id="overview">
          <div>
            <span className="section-kicker">پنل کسب‌وکار</span>
            <h1>{displayName}</h1>
            <p>اطلاعات، نمونه‌کارها، درخواست‌ها و وضعیت اشتراک را از همین‌جا مدیریت کن.</p>
            {source === "server" ? <a href="/dashboard/billing" className={"dashboard-current-plan plan-" + (profile.plan || "free")}>پلن فعلی: {planLabel} · مشاهده پلن‌ها</a> : <p>{source === "loading" ? "در حال دریافت وضعیت اشتراک…" : "وضعیت اشتراک دریافت نشد؛ برای مشاهده اطلاعات به‌روز، صفحه را دوباره باز کنید."}</p>}
            {source === "server" && profile.plan !== "free" && profile.planEndsAt && <p>پایان اعتبار فعلی: {new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(profile.planEndsAt) ? profile.planEndsAt : profile.planEndsAt.replace(" ", "T") + "Z").toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran", year: "numeric", month: "long", day: "numeric" })}</p>}
          </div>
          <div className="dashboard-heading-actions">
            {profile.businessSlug && <a className="pill-button" href={"/business/"+profile.businessSlug} target="_blank" rel="noreferrer"><Eye size={17}/> نمایش غرفه</a>}
            {profile.businessSlug && <a className="pill-button" href="#public-link">کیوآرکد گالری</a>}
            <a className="pill-button" href="#leads"><Bell size={18} /> درخواست‌ها ({profile.leadCount || 0})</a>
            <a className="pill-button dark" href="/dashboard/profile"><Store size={17} /> ویرایش پروفایل</a>
          </div>
        </div>

        {source === "server" && <BusinessInstallmentToggle />}
        <div id="media" style={sectionStyle("media")}>
          {source === "server" && <BusinessMediaManager plan={profile.plan || "free"} />}
        </div>
        <div style={sectionStyle("public-link")}>
        <BusinessPublicLinkCard
          slug={profile.businessSlug}
          status={profile.status}
          onSlugChange={(businessSlug) => setProfile((current) => ({ ...current, businessSlug }))}
        />
        {source === "server" && <PreparedStoryStudio />}

        </div>
        <div style={sectionStyle("overview")} className="dashboard-panel glass-panel">
          <h2>عملکرد غرفه</h2>
          <p>آمار ثبت‌شده بازدید، درخواست‌ها و امکانات گزارش اشتراک خود را ببینید.</p>
          <a className="pill-button dark" href="#analytics">مشاهده آمار غرفه</a>
        </div>

        <div style={sectionStyle("profile")} className="dashboard-grid">
          <section style={sectionStyle("profile")} className="dashboard-panel glass-panel" id="profile">
            <div className="panel-heading">
              <div><span className="section-kicker">آمادگی انتشار</span><h2>تکمیل پروفایل</h2></div>
              <span className="status-pill">{profile.status === "published" ? "منتشرشده" : "پیش‌نویس"}</span>
            </div>
            <div className="profile-progress"><span style={{ width: completion + "%" }} /></div>
            <div className="dashboard-progress-label"><strong>{completion}٪ تکمیل</strong><span>پروفایل‌های کامل‌تر اعتماد بیشتری ایجاد می‌کنند.</span></div>

            <div className="dashboard-checklist">
              {nextTasks.map((task) => (
                <div className={task.done ? "is-done" : ""} key={task.label}>
                  <span>{task.done ? <BadgeCheck size={16} /> : <span className="check-dot" />}</span>
                  <strong>{task.label}</strong>
                </div>
              ))}
            </div>

            <a className="pill-button dark" href="/dashboard/profile">ادامه تکمیل پروفایل</a>
          </section>



        </div>

        <div style={{display:["services","leads","settings"].includes(activeSection) ? "block" : "none"}} className="dashboard-grid">
          <section style={sectionStyle("services")} className="dashboard-panel glass-panel" id="services">
            <div className="panel-heading">
              <div><span className="section-kicker">خدمات و محدوده</span><h2>پوشش کسب‌وکار</h2></div>
              <MapPin size={20} />
            </div>
            <div className="dashboard-service-list">
              {(services.length ? services : ["خدمات هنوز ثبت نشده"]).map((service) => <span key={service}>{service}</span>)}
            </div>
            <p>موقعیت فعلی: {location || "ثبت نشده"}</p>
          </section>

          <p style={sectionStyle("settings")}><a href="/dashboard/campaigns">مدیریت کمپین و جشنواره</a> · <a href="/support">پشتیبانی و گزارش مشکل</a></p>
          <div style={sectionStyle("leads")}><BusinessBrowserNotifications /><BusinessLeadInbox /></div>
        </div>

        <div style={sectionStyle("analytics")}><BusinessAnalyticsPanel plan={profile.plan || "free"} /></div>

        <div style={sectionStyle("reviews")}><BusinessReviewPanel /></div>

        <div style={sectionStyle("settings")}><BusinessVisibilitySettings /></div>

        <div style={sectionStyle("profile")}><BusinessPublicationPanel
          initialStatus={(profile.status || "") as any}
          initialVerificationStatus={profile.verificationStatus || ""}
          initialModerationReason={profile.moderationReason || ""}
        />

        </div>
        <section style={sectionStyle("profile")} className="dashboard-panel glass-panel dashboard-verification-panel">
          <div>
            <span className="section-kicker">اعتماد و اعتبار</span>
            <h2>تأیید کسب‌وکار</h2>
            <p>تأیید شماره تماس پایه است. برای نشان تأییدشده، اطلاعات و مدارک کسب‌وکار بررسی می‌شوند و این نشان خریدنی نیست.</p>
            {source === "browser" && (
              <small className="dashboard-source-note">این مرورگر هنوز Session سروری ندارد؛ بعد از فعال‌شدن Session، اطلاعات مستقیماً از D1 خوانده می‌شوند.</small>
            )}
          </div>
          <div className="dashboard-verification-steps">
            <span><ShieldCheck size={17} /> تأیید موبایل</span>
            <span><FileText size={17} /> اطلاعات هویتی / صنفی</span>
            <span><BadgeCheck size={17} /> بررسی خونه نما</span>
          </div>
        </section>
      </div>
    </div>
  );
}
