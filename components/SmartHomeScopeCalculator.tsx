"use client";

import { Home, RotateCcw, Router, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Counts = {
  lighting: string;
  curtains: string;
  climate: string;
  locks: string;
  presence: string;
  openings: string;
  safety: string;
  cameras: string;
  plugs: string;
};

const defaults: Counts = {
  lighting: "8",
  curtains: "2",
  climate: "1",
  locks: "1",
  presence: "3",
  openings: "2",
  safety: "2",
  cameras: "0",
  plugs: "2",
};

const labels: Record<keyof Counts, string> = {
  lighting: "مدار روشنایی / کلید",
  curtains: "پرده برقی",
  climate: "زون دما / ترموستات",
  locks: "قفل هوشمند",
  presence: "سنسور حرکت / حضور",
  openings: "سنسور در و پنجره",
  safety: "نشتی آب / دود / ایمنی",
  cameras: "دوربین",
  plugs: "پریز / Smart Plug",
};

function n(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(200, parsed)) : 0;
}

function fa(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export default function SmartHomeScopeCalculator() {
  const [counts, setCounts] = useState<Counts>(defaults);
  const [projectType, setProjectType] = useState("retrofit");
  const [internetFallback, setInternetFallback] = useState(true);
  const [remoteAccess, setRemoteAccess] = useState(true);

  const result = useMemo(() => {
    const parsed = Object.fromEntries(
      Object.entries(counts).map(([key, value]) => [key, n(value)])
    ) as Record<keyof Counts, number>;

    const total = Object.values(parsed).reduce((sum, value) => sum + value, 0);
    const automationPoints =
      parsed.lighting + parsed.curtains + parsed.climate + parsed.plugs;
    const securityPoints =
      parsed.locks + parsed.presence + parsed.openings + parsed.safety + parsed.cameras;

    const complexity =
      total <= 10 ? "کوچک و مرحله‌ای" :
      total <= 25 ? "متوسط" :
      total <= 50 ? "گسترده" : "پروژه بزرگ";

    const needsNetworkPlan = total >= 15 || parsed.cameras >= 2 || remoteAccess;
    const needsPowerPlan =
      projectType === "new-build" &&
      (parsed.lighting + parsed.curtains + parsed.climate >= 10);
    const needsLocalControl =
      internetFallback && (automationPoints > 0 || securityPoints > 0);

    const priorities: string[] = [];
    if (parsed.lighting > 0) priorities.push("سناریوی روشنایی");
    if (parsed.curtains > 0) priorities.push("کنترل پرده و نور طبیعی");
    if (parsed.climate > 0) priorities.push("کنترل دما");
    if (parsed.locks + parsed.cameras + parsed.openings > 0) priorities.push("امنیت و دسترسی");
    if (parsed.safety > 0) priorities.push("ایمنی و هشدار");

    return {
      parsed,
      total,
      automationPoints,
      securityPoints,
      complexity,
      needsNetworkPlan,
      needsPowerPlan,
      needsLocalControl,
      priorities,
    };
  }, [counts, projectType, internetFallback, remoteAccess]);

  const set = (key: keyof Counts, value: string) =>
    setCounts((current) => ({ ...current, [key]: value }));

  return (
    <section className="smart-scope-shell" aria-labelledby="smart-scope-title">
      <div className="smart-scope-card glass-panel">
        <div className="smart-scope-head">
          <div>
            <span className="section-kicker">Scope اولیه پروژه</span>
            <h2 id="smart-scope-title">برآورد محدوده خانه هوشمند</h2>
            <p>
              تعداد نقاط موردنیاز را وارد کنید. ابزار قیمت نمی‌سازد؛ یک Scope اولیه می‌دهد تا
              پیشنهاد چند مجری را با محدوده یکسان مقایسه کنید.
            </p>
          </div>
          <span className="smart-scope-icon"><Home size={25} /></span>
        </div>

        <div className="smart-project-type">
          <label>
            <span>نوع پروژه</span>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              <option value="retrofit">خانه آماده / Retrofit</option>
              <option value="new-build">ساختمان نوساز / بازسازی اساسی</option>
              <option value="rental">خانه اجاره‌ای / کم‌تخریب</option>
            </select>
          </label>
        </div>

        <div className="smart-scope-grid">
          {(Object.keys(labels) as (keyof Counts)[]).map((key) => (
            <label key={key}>
              <span>{labels[key]}</span>
              <div>
                <button type="button" aria-label={"کم کردن " + labels[key]} onClick={() => set(key, String(Math.max(0, n(counts[key]) - 1)))}>−</button>
                <input inputMode="numeric" value={counts[key]} onChange={(e) => set(key, e.target.value)} />
                <button type="button" aria-label={"زیاد کردن " + labels[key]} onClick={() => set(key, String(n(counts[key]) + 1))}>+</button>
              </div>
            </label>
          ))}
        </div>

        <div className="smart-scope-options">
          <label className="tool-check">
            <input type="checkbox" checked={internetFallback} onChange={(e) => setInternetFallback(e.target.checked)} />
            <span>می‌خواهم عملکردهای پایه هنگام قطع اینترنت هم قابل استفاده بمانند</span>
          </label>
          <label className="tool-check">
            <input type="checkbox" checked={remoteAccess} onChange={(e) => setRemoteAccess(e.target.checked)} />
            <span>کنترل از بیرون خانه / Remote Access می‌خواهم</span>
          </label>
        </div>

        <button type="button" className="smart-scope-reset" onClick={() => {
          setCounts(defaults);
          setProjectType("retrofit");
          setInternetFallback(true);
          setRemoteAccess(true);
        }}>
          <RotateCcw size={15} /> بازنشانی
        </button>
      </div>

      <aside className="smart-scope-result glass-panel" aria-live="polite">
        <span className="section-kicker">خلاصه Scope</span>
        <div className="smart-scope-total">
          <span>کل نقاط تعریف‌شده</span>
          <strong>{fa(result.total)}</strong>
          <small>سطح پروژه: {result.complexity}</small>
        </div>

        <div className="smart-scope-summary">
          <div><span>اتوماسیون و آسایش</span><strong>{fa(result.automationPoints)}</strong></div>
          <div><span>امنیت و سنسورها</span><strong>{fa(result.securityPoints)}</strong></div>
        </div>

        <div className="smart-scope-recommendations">
          <h3>مواردی که باید در پیشنهاد مجری مشخص شوند</h3>
          {result.needsNetworkPlan && <p><Router size={15} /> طراحی شبکه، محل Hub/Controller و پوشش Wi‑Fi/Thread/Zigbee</p>}
          {result.needsPowerPlan && <p><Sparkles size={15} /> تابلو برق، مسیر کابل و ظرفیت توسعه آینده</p>}
          {result.needsLocalControl && <p><ShieldCheck size={15} /> کنترل محلی، Manual Override و رفتار سیستم هنگام قطع اینترنت</p>}
          <p><ShieldCheck size={15} /> برند و مدل دقیق تجهیزات، پروتکل، گارانتی و مدت پشتیبانی</p>
          <p><ShieldCheck size={15} /> تحویل نقشه، تنظیمات، دسترسی‌های مالک و روش Backup/Restore</p>
        </div>

        {result.priorities.length > 0 && (
          <div className="smart-scope-priorities">
            <span>کاربری‌های اصلی این Scope</span>
            <div>{result.priorities.map((item) => <b key={item}>{item}</b>)}</div>
          </div>
        )}

        <details className="smart-scope-details">
          <summary>ریز نقاط پروژه</summary>
          <ul>
            {(Object.keys(labels) as (keyof Counts)[])
              .filter((key) => result.parsed[key] > 0)
              .map((key) => <li key={key}><span>{labels[key]}</span><strong>{fa(result.parsed[key])}</strong></li>)}
          </ul>
        </details>

        <p className="smart-scope-disclaimer">
          این خروجی Scope اولیه است، نه نقشه اجرایی و نه برآورد قیمت. متراژ، تعداد طبقات، زیرساخت برق،
          شبکه، برند، پروتکل و سناریوها باید در بازدید و طراحی نهایی مشخص شوند.
        </p>
      </aside>
    </section>
  );
}
