"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Loader2, Save } from "lucide-react";

type DayRow = {
  weekday: number;
  label: string;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

const labels = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const defaults: DayRow[] = labels.map((label, weekday) => ({
  weekday,
  label,
  opensAt: weekday === 6 ? "10:00" : "09:00",
  closesAt: weekday === 6 ? "14:00" : "20:00",
  isClosed: weekday === 6,
}));

export default function BusinessHoursEditor() {
  const [rows, setRows] = useState<DayRow[]>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/me/business/hours", { cache: "no-store" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");

        if (!cancelled && Array.isArray(result.hours) && result.hours.length) {
          const byDay = new Map(result.hours.map((item: any) => [Number(item.weekday), item]));
          setRows(
            defaults.map((base) => {
              const saved: any = byDay.get(base.weekday);
              return saved
                ? {
                    ...base,
                    opensAt: saved.opens_at || base.opensAt,
                    closesAt: saved.closes_at || base.closesAt,
                    isClosed: Boolean(saved.is_closed),
                  }
                : base;
            })
          );
        }
      } catch {
        if (!cancelled) setMessage("ساعات کاری هنوز ثبت نشده است.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(weekday: number, patch: Partial<DayRow>) {
    setRows((current) =>
      current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row))
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/me/business/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: rows.map((row) => ({
            weekday: row.weekday,
            opensAt: row.opensAt,
            closesAt: row.closesAt,
            isClosed: row.isClosed,
          })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        if (result?.error === "INVALID_RANGE") {
          setMessage("ساعت پایان هر روز باید بعد از ساعت شروع باشد.");
        } else {
          setMessage("ذخیره ساعات کاری انجام نشد.");
        }
        return;
      }
      setMessage("ساعات کاری ذخیره شد و در پروفایل عمومی نمایش داده می‌شود.");
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-panel glass-panel profile-hours-card">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">زمان پاسخ‌گویی</span>
          <h2>ساعات کاری</h2>
        </div>
        <CalendarClock size={20} />
      </div>

      {loading ? (
        <div className="profile-hours-loading"><Loader2 className="spin" size={18} /> در حال دریافت...</div>
      ) : (
        <div className="profile-hours-list">
          {rows.map((row) => (
            <div className={"profile-hours-row " + (row.isClosed ? "is-closed" : "")} key={row.weekday}>
              <strong>{row.label}</strong>
              <label className="hours-closed-toggle">
                <input
                  type="checkbox"
                  checked={row.isClosed}
                  onChange={(event) => update(row.weekday, { isClosed: event.target.checked })}
                />
                <span>{row.isClosed ? "تعطیل" : "باز"}</span>
              </label>
              <label>
                <span>از</span>
                <input
                  type="time"
                  value={row.opensAt}
                  disabled={row.isClosed}
                  onChange={(event) => update(row.weekday, { opensAt: event.target.value })}
                />
              </label>
              <label>
                <span>تا</span>
                <input
                  type="time"
                  value={row.closesAt}
                  disabled={row.isClosed}
                  onChange={(event) => update(row.weekday, { closesAt: event.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className="profile-hours-message">
          {message.includes("ذخیره شد") ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
          {message}
        </div>
      )}

      <button className="pill-button dark" type="button" onClick={save} disabled={loading || saving}>
        <Save size={15} /> {saving ? "در حال ذخیره..." : "ذخیره ساعات کاری"}
      </button>
    </section>
  );
}
