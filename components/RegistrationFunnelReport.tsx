"use client";

import { useEffect, useState } from "react";

type Stage = { event: string; label: string; count: number };
type Report = { ok: boolean; periodDays: number; stages: Stage[]; submitFailures: number; privacy: string };

export default function RegistrationFunnelReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/registration-funnel", { cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ok) throw new Error("گزارش فعلاً در دسترس نیست.");
        setReport(data);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <p className="shell">{error}</p>;
  if (!report) return <p className="shell">در حال آماده‌سازی گزارش ثبت‌نام…</p>;

  return <section className="inner-page"><div className="shell">
    <span className="section-kicker">ارزیابی ثبت‌نام</span>
    <h1>قیف ساخت غرفه</h1>
    <p>این گزارش، جمع ۳۰ روز اخیر را نشان می‌دهد و مشخص می‌کند افراد تا کدام مرحلهٔ فرم کوتاه پیش رفته‌اند. رویدادهای مراحل جدید از امروز جمع می‌شوند؛ آمار قدیمی با فرم قبلی هم‌سنخ نیست.</p>
    <div className="dashboard-panel glass-panel" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%" }}>
        <thead><tr><th>مرحله</th><th>تعداد</th><th>ریزش از مرحله قبل</th></tr></thead>
        <tbody>{report.stages.map((stage, index) => {
          const before = index ? report.stages[index - 1].count : null;
          const drop = before && before > 0 ? Math.max(0, Math.round((1 - stage.count / before) * 100)) : null;
          return <tr key={stage.event}><td>{stage.label}</td><td>{stage.count.toLocaleString("fa-IR")}</td><td>{drop == null ? "—" : `${drop.toLocaleString("fa-IR")}٪`}</td></tr>;
        })}</tbody>
      </table>
      <p>تلاش ناموفق برای ثبت نهایی: <strong>{report.submitFailures.toLocaleString("fa-IR")}</strong></p>
      <p className="field-hint">{report.privacy}</p>
    </div>
  </div></section>;
}
