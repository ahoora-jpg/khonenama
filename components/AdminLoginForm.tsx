"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

export default function AdminLoginForm() {
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        if (result?.error === "ADMIN_NOT_CONFIGURED") {
          setMessage("کلید مدیریت هنوز در Cloudflare تنظیم نشده است.");
        } else {
          setMessage("کلید مدیریت صحیح نیست.");
        }
        return;
      }
      window.location.href = "/admin/businesses";
    } catch {
      setMessage("ورود انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-card glass-panel">
      <span className="business-login-icon"><KeyRound size={22} /></span>
      <span className="section-kicker">مدیریت خونه‌نما</span>
      <h1>ورود مدیر</h1>
      <p>این بخش فقط برای مدیریت داخلی خونه‌نماست.</p>
      <label>
        <span>کلید مدیریت</span>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="current-password" />
      </label>
      <button className="pill-button dark" type="button" onClick={submit} disabled={loading || key.length < 8}>
        {loading ? "در حال ورود..." : "ورود مدیریت"} <ShieldCheck size={16} />
      </button>
      {message && <div className="business-login-message">{message}</div>}
    </div>
  );
}
