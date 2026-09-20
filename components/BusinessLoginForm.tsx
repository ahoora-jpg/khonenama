"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Phone, ShieldCheck } from "lucide-react";

export default function BusinessLoginForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage("");

    if (phone.trim().length < 10 || password.length < 8) {
      setMessage("شماره همراه و رمز عبور را کامل وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/business/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        const messages: Record<string, string> = {
          INVALID_CREDENTIALS: "شماره همراه یا رمز عبور صحیح نیست.",
          NO_BUSINESS: "برای این حساب کسب‌وکاری ثبت نشده است.",
          PASSWORD_SCHEMA_REQUIRED: "ورود با رمز هنوز در دیتابیس فعال نشده است.",
          D1_BINDING_NOT_AVAILABLE: "اتصال دیتابیس در دسترس نیست.",
        };
        setMessage(messages[result?.error] || "ورود انجام نشد. دوباره تلاش کنید.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="business-login-card glass-panel">
      <span className="business-login-icon"><KeyRound size={22} /></span>
      <span className="section-kicker">ورود امن کسب‌وکار</span>
      <h1>ورود به پنل مدیریت</h1>
      <p>با شماره همراه و رمزی که هنگام ثبت حساب انتخاب کرده‌اید وارد شوید.</p>

      <label>
        <span>شماره همراه</span>
        <div className="form-input">
          <Phone size={17} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="09..." />
        </div>
      </label>

      <label>
        <span>رمز عبور</span>
        <div className="form-input">
          <LockKeyhole size={17} />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="رمز عبور"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button className="password-visibility" type="button" onClick={() => setShowPassword((value) => !value)} aria-label="نمایش یا پنهان‌کردن رمز">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      <button className="register-submit" type="button" onClick={submit} disabled={loading}>
        {loading ? "در حال ورود..." : "ورود به پنل"} <ArrowLeft size={16} />
      </button>

      {message && <div className="business-login-message"><ShieldCheck size={16} /> {message}</div>}

      <div className="business-login-links">
        <a href="/register-business">کسب‌وکار جدید؟ ثبت رایگان</a>
        <a href="/business/forgot-password">رمز عبور را فراموش کرده‌ام</a>
      </div>
      <a className="admin-login-entry" href="/admin/login">ورود مدیریت خونه‌نما</a>
    </div>
  );
}
