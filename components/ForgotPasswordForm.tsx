"use client";

import { useState } from "react";
import { ArrowRight, Mail, Phone, RotateCcw } from "lucide-react";

export default function ForgotPasswordForm() {
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  function submit() {
    setMessage(
      method === "email"
        ? "ساختار بازیابی ایمیلی آماده شده است؛ ارسال لینک بعد از اتصال سرویس ایمیل فعال می‌شود."
        : "ساختار بازیابی پیامکی آماده شده است؛ ارسال کد بعد از اتصال سرویس SMS فعال می‌شود."
    );
  }

  return (
    <div className="business-login-card glass-panel">
      <span className="business-login-icon"><RotateCcw size={22} /></span>
      <span className="section-kicker">بازیابی رمز</span>
      <h1>انتخاب روش بازیابی</h1>
      <p>در زمان بهره‌برداری، ایمیل مسیر اصلی و پیامک مسیر جایگزین خواهد بود.</p>

      <div className="recovery-methods">
        <button type="button" className={method === "email" ? "is-active" : ""} onClick={() => setMethod("email")}>
          <Mail size={16} /> ایمیل
        </button>
        <button type="button" className={method === "sms" ? "is-active" : ""} onClick={() => setMethod("sms")}>
          <Phone size={16} /> پیامک
        </button>
      </div>

      <label>
        <span>{method === "email" ? "ایمیل حساب" : "شماره همراه"}</span>
        <div className="form-input">
          {method === "email" ? <Mail size={17} /> : <Phone size={17} />}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={method === "email" ? "email" : "text"}
            inputMode={method === "sms" ? "tel" : "email"}
            placeholder={method === "email" ? "name@example.com" : "09..."}
          />
        </div>
      </label>

      <button className="register-submit" type="button" onClick={submit} disabled={!value.trim()}>
        ادامه بازیابی
      </button>

      {message && <div className="business-login-message">{message}</div>}

      <a className="admin-login-entry" href="/business/login"><ArrowRight size={14} /> بازگشت به ورود</a>
    </div>
  );
}
