"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Phone, ShieldCheck } from "lucide-react";

export default function BusinessLoginForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [credentialError, setCredentialError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setMessage("");
    setCredentialError(false);
    setPhoneError("");
    setPasswordError("");

    const actualPhone = phoneRef.current?.value ?? phone;
    const actualPassword = passwordRef.current?.value ?? password;

    if (actualPhone !== phone) setPhone(actualPhone);
    if (actualPassword !== password) setPassword(actualPassword);

    let invalid = false;
    if (actualPhone.trim().length < 10) {
      setPhoneError("شماره همراه را کامل وارد کنید.");
      invalid = true;
    }
    if (!actualPassword) {
      setPasswordError("رمز عبور را وارد کنید.");
      invalid = true;
    }
    if (invalid) {
      setMessage("اطلاعات ورود را کامل کنید.");
      requestAnimationFrame(() => {
        if (actualPhone.trim().length < 10) phoneRef.current?.focus();
        else passwordRef.current?.focus();
      });
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/auth/business/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: actualPhone, password: actualPassword }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        const messages: Record<string, string> = {
          INVALID_CREDENTIALS: "شماره همراه یا رمز عبور صحیح نیست.",
          NO_BUSINESS: "برای این حساب کسب‌وکاری ثبت نشده است.",
          PASSWORD_SCHEMA_REQUIRED: "ورود با رمز هنوز در دیتابیس فعال نشده است.",
          D1_BINDING_NOT_AVAILABLE: "اتصال دیتابیس در دسترس نیست.",
          PASSWORD_REHASH_REQUIRED: "رمز این حساب از نسخه قدیمی سیستم است. یک‌بار از پنل مدیریت وارد شوید و دوباره همین رمز را بزنید تا خودکار به نسخه جدید منتقل شود.",
          INTERNAL_ERROR: "ورود در سرور با خطا روبه‌رو شد. کد خطا ثبت شده و باید بررسی شود.",
        };
        const text = messages[result?.error] || "ورود انجام نشد. دوباره تلاش کنید.";
        setMessage(text);
        if (result?.error === "INVALID_CREDENTIALS") {
          setCredentialError(true);
        }
        return;
      }

      window.location.href = "/dashboard";
    } catch (error: any) {
      if (error?.name === "AbortError") {
        setMessage("پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.");
      } else {
        setMessage("ارتباط با سرور برقرار نشد.");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <form
      className="business-login-card glass-panel"
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <span className="business-login-icon"><KeyRound size={22} /></span>
      <span className="section-kicker">ورود امن کسب‌وکار</span>
      <h1>ورود به پنل مدیریت</h1>
      <p>با شماره همراه و رمزی که هنگام ثبت حساب انتخاب کرده‌اید وارد شوید.</p>

      <label>
        <span>شماره همراه</span>
        <div className="form-input">
          <Phone size={17} />
          <input
            ref={phoneRef}
            name="khonenama_business_phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError("");
            }}
            inputMode="tel"
            autoComplete="off"
            placeholder="09..."
          />
        </div>
        {phoneError && (
          <div className="login-inline-error" role="alert">{phoneError}</div>
        )}
      </label>

      <label>
        <span>رمز عبور</span>
        <div className={credentialError ? "form-input login-input-error" : "form-input"}>
          <LockKeyhole size={17} />
          <input
            ref={passwordRef}
            id="business-login-password"
            name="khonenama_business_password"
            dir="ltr"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
              if (credentialError) {
                setCredentialError(false);
                setMessage("");
              }
            }}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="رمز عبور"
          />
          <button
            className="password-visibility password-visibility-inline"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            <span>{showPassword ? "پنهان" : "نمایش"}</span>
          </button>
        </div>
        {passwordError && (
          <div className="login-inline-error" role="alert">{passwordError}</div>
        )}
        {credentialError && (
          <div className="login-inline-error" role="alert" aria-live="assertive">
            رمز عبور یا شماره همراه صحیح نیست. دوباره بررسی کنید.
          </div>
        )}
      </label>

      <button className="register-submit" type="submit" disabled={loading}>
        {loading ? "در حال ورود..." : "ورود به پنل"} <ArrowLeft size={16} />
      </button>

      {message && !credentialError && (
        <div className="business-login-message" role="status" aria-live="polite">
          <ShieldCheck size={16} /> {message}
        </div>
      )}

      <div className="business-login-links">
        <a href="/register-business">کسب‌وکار جدید؟ ثبت رایگان</a>
        <a href="/business/forgot-password">رمز عبور را فراموش کرده‌ام</a>
      </div>
      <a className="admin-login-entry" href="/admin/login">ورود مدیریت خونه‌نما</a>
    </form>
  );
}
