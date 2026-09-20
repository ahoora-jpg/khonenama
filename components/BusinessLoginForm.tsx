"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound, Phone, ShieldCheck } from "lucide-react";

export default function BusinessLoginForm() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function submit() {
    if (phone.trim().length < 10) {
      setMessage("شماره همراه را کامل وارد کنید.");
      return;
    }
    setMessage("رابط ورود آماده است؛ ارسال OTP بعد از اتصال سرویس پیامک و Session سرور فعال می‌شود.");
  }

  return (
    <div className="business-login-card glass-panel">
      <span className="business-login-icon"><KeyRound size={22} /></span>
      <span className="section-kicker">ورود امن کسب‌وکار</span>
      <h1>ورود به پنل مدیریت</h1>
      <p>با همان شماره‌ای وارد شوید که هنگام ثبت کسب‌وکار استفاده کرده‌اید.</p>

      <label>
        <span>شماره همراه</span>
        <div className="form-input">
          <Phone size={17} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="09..." />
        </div>
      </label>

      <button className="register-submit" type="button" onClick={submit}>
        دریافت کد ورود <ArrowLeft size={16} />
      </button>

      {message && <div className="business-login-message"><ShieldCheck size={16} /> {message}</div>}

      <div className="business-login-links">
        <a href="/register-business">کسب‌وکار جدید؟ ثبت رایگان</a>
        <a href="/for-business">آشنایی با امکانات</a>
      </div>
      <a className="admin-login-entry" href="/admin/login">ورود مدیریت خونه‌نما</a>
    </div>
  );
}
