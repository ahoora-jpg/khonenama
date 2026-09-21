"use client";

import BusinessLogoutButton from "@/components/BusinessLogoutButton";
import BusinessPublicationPanel from "@/components/BusinessPublicationPanel";
import BusinessPublicLinkCard from "@/components/BusinessPublicLinkCard";
import BusinessMediaManager from "@/components/BusinessMediaManager";
import BusinessLeadInbox from "@/components/BusinessLeadInbox";
import BusinessReviewPanel from "@/components/BusinessReviewPanel";

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
  verificationStatus?: string;
  completion?: number;
  plan?: string;
  leadCount?: number;
  businessSlug?: string;
};

const nav = [
  ["نمای کلی", "#overview", Store],
  ["اطلاعات پروفایل", "#profile", FileText],
  ["خدمات و محدوده", "#services", MapPin],
  ["نمونه‌کارها", "#media", ImagePlus],
  ["درخواست‌های مشتری", "#leads", MessageCircle],
  ["نظرها", "#reviews", BadgeCheck],
  ["آمار", "#analytics", BarChart3],
  ["اشتراک و پرداخت", "/dashboard/billing", CreditCard],
  ["اعضای تیم", "#team", Users],
  ["تنظیمات", "#settings", Settings],
] as const;

export default function BusinessDashboardContent() {
  const [profile, setProfile] = useState<StoredProfile>({});
  const [source, setSource] = useState<"server" | "browser" | "loading">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/me/business", { cache: "no-store" });
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
              verificationStatus: business.verification_status,
              completion: business.completion,
              plan: business.plan?.code || "free",
              leadCount: business.leadCount || 0,
              businessSlug: business.slug,
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
    return () => {
      cancelled = true;
    };
  }, []);

  const completion = profile.completion || (profile.businessName ? 58 : 22);
  const stats = [
    { label: "بازدید پروفایل", value: "—", icon: Eye },
    { label: "کلیک تماس", value: "—", icon: MousePointerClick },
    { label: "درخواست مشتری", value: String(profile.leadCount ?? 0), icon: MessageCircle },
    { label: "نمایش در جستجو", value: "—", icon: BarChart3 },
  ];
  const displayName = profile.businessName || "کسب‌وکار شما";
  const location = [profile.city || "کرج", profile.area].filter(Boolean).join("، ");
  const services = profile.services || [];
  const planLabel =
    profile.plan === "premium" ? "ویژه" :
    profile.plan === "pro" ? "حرفه‌ای" :
    "پایه";

  const nextTasks = useMemo(() => {
    const tasks = [
      { label: "تأیید شماره همراه", done: false },
      { label: "تکمیل آدرس و محدوده", done: Boolean(profile.city && profile.area) },
      { label: "افزودن حداقل ۳ تصویر", done: false },
      { label: "ثبت خدمات اصلی", done: services.length > 0 },
    ];
    return tasks;
  }, [profile, services.length]);

  return (
    <div className="business-dashboard-shell">
      <aside className="business-dashboard-nav glass-panel">
        <div className="dashboard-business-mini">
          <span className="dashboard-business-avatar"><Store size={20} /></span>
          <div>
            <strong>{displayName}</strong>
            <small>{location}</small>
            <span className={"dashboard-plan-badge plan-" + (profile.plan || "free")}>{planLabel}</span>
          </div>
        </div>

        <nav>
          {nav.map(([label, href, Icon], index) => (
            <a className={index === 0 ? "is-active" : ""} href={href} key={label}>
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
            <span className={"dashboard-current-plan plan-" + (profile.plan || "free")}>پلن فعلی: {planLabel}</span>
          </div>
          <div className="dashboard-heading-actions">
            <button className="icon-button" type="button" aria-label="اعلان‌ها"><Bell size={18} /></button>
            <a className="pill-button dark" href="/dashboard/profile"><Store size={17} /> ویرایش پروفایل</a>
          </div>
        </div>

        <BusinessPublicLinkCard
          slug={profile.businessSlug}
          status={profile.status}
          onSlugChange={(businessSlug) => setProfile((current) => ({ ...current, businessSlug }))}
        />

        <div className="dashboard-stats">
          {stats.map(({ label, value, icon: Icon }) => (
            <div className="dashboard-stat glass-panel" key={label}>
              <Icon size={20} />
              <span><strong>{value}</strong><small>{label}</small></span>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-panel glass-panel" id="profile">
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

          <BusinessMediaManager plan={profile.plan || "free"} />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-panel glass-panel" id="services">
            <div className="panel-heading">
              <div><span className="section-kicker">خدمات و محدوده</span><h2>پوشش کسب‌وکار</h2></div>
              <MapPin size={20} />
            </div>
            <div className="dashboard-service-list">
              {(services.length ? services : ["خدمات هنوز ثبت نشده"]).map((service) => <span key={service}>{service}</span>)}
            </div>
            <p>موقعیت فعلی: {location || "ثبت نشده"}</p>
          </section>

          <BusinessLeadInbox />
        </div>

        <BusinessReviewPanel />

        <BusinessPublicationPanel
          initialStatus={(profile.status || "") as any}
          initialVerificationStatus={profile.verificationStatus || ""}
        />

        <section className="dashboard-panel glass-panel dashboard-verification-panel">
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
            <span><BadgeCheck size={17} /> بررسی خونه‌نما</span>
          </div>
        </section>
      </div>
    </div>
  );
}
