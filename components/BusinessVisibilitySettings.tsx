"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function BusinessVisibilitySettings() {
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/me/business/visibility", { cache:"no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (result?.ok) setPaused(Boolean(result.ownerPaused));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    const next = !paused;
    if (next && !window.confirm("نمایش عمومی پروفایل متوقف شود؟ هر زمان بخواهید می‌توانید دوباره فعالش کنید.")) return;

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/me/business/visibility", {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ ownerPaused:next }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error();
      setPaused(Boolean(result.ownerPaused));
      setMessage(next ? "پروفایل از نمایش عمومی خارج شد." : "پروفایل دوباره در سایت قابل مشاهده است.");
    } catch {
      setMessage("تغییر وضعیت انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-panel glass-panel visibility-settings" id="settings">
      <div className="panel-heading">
        <div><span className="section-kicker">کنترل حضور عمومی</span><h2>نمایش پروفایل</h2></div>
        {paused ? <EyeOff size={20} /> : <Eye size={20} />}
      </div>
      <p>
        اگر موقتاً نمی‌خواهید مشتری جدید دریافت کنید، بدون حذف حساب می‌توانید پروفایل را از جستجو و صفحه عمومی خارج کنید.
      </p>
      <div className={"visibility-status " + (paused ? "is-paused" : "is-live")}>
        <ShieldCheck size={15} />
        <strong>{loading ? "در حال بررسی..." : paused ? "نمایش عمومی متوقف است" : "پروفایل عمومی فعال است"}</strong>
      </div>
      <button className={paused ? "pill-button dark" : "pill-button"} type="button" onClick={toggle} disabled={loading || saving}>
        {saving ? "در حال ذخیره..." : paused ? "فعال‌سازی دوباره" : "توقف موقت نمایش"}
      </button>
      {message && <small className="visibility-message">{message}</small>}
    </section>
  );
}
