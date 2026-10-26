"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

export default function AdminLoginForm({ redirectTo = "/admin/businesses", keyLabel = "کلید مدیریت", title = "ورود مدیر" }: { redirectTo?: string; keyLabel?: string; title?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(form: HTMLFormElement) {
    const key = String(new FormData(form).get("khonenama_admin_access_key") || "");
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
      window.location.href = redirectTo;
    } catch {
      setMessage("ورود انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="admin-login-card glass-panel"
      autoComplete="on"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
    >
      <span className="business-login-icon"><KeyRound size={22} /></span>
      <span className="section-kicker">مدیریت خونه نما</span>
      <h1>{title}</h1>
      <p>این بخش فقط برای مدیریت داخلی خونه نماست.</p>
      <label>
        <span>{keyLabel}</span>
        <div className="admin-password-field">
        <input
          type={showPassword ? "text" : "password"}
          name="khonenama_admin_access_key"
          required
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button className="admin-password-toggle" type="button" aria-label={showPassword ? "پنهان‌کردن رمز" : "نمایش رمز"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        </div>
      </label>
      <button className="pill-button dark" type="submit" disabled={loading}>
        {loading ? "در حال ورود..." : "ورود مدیریت"} <ShieldCheck size={16} />
      </button>
      {message && <div className="business-login-message">{message}</div>}
    </form>
  );
}
