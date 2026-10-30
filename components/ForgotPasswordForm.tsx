"use client";

import { useEffect, useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [helpMode, setHelpMode] = useState(false);
  const [message, setMessage] = useState("در حال بررسی سرویس…");

  useEffect(() => {
    const resetToken = new URLSearchParams(location.hash.slice(1)).get("reset");
    if (resetToken) {
      setToken(resetToken);
      history.replaceState(null, "", location.pathname);
      setMessage("");
      return;
    }
    fetch("/api/auth/business/recovery", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setReady(data.available === true);
        setMessage(data.available ? "" : "ارسال ایمیل فعلاً در دسترس نیست؛ از پشتیبانی کمک بگیرید.");
      })
      .catch(() => setMessage("ارتباط برقرار نشد؛ صفحه را دوباره باز کنید."));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (token && password !== confirm) {
      setMessage("تکرار رمز یکسان نیست.");
      return;
    }
    setBusy(true);
    try {
      const body = token
        ? { action: "reset", token, password }
        : helpMode
          ? { action: "email_access_help", phone }
          : { email, phone };
      const response = await fetch("/api/auth/business/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const errors: Record<string, string> = {
          TOO_MANY_ATTEMPTS: "یک ساعت دیگر دوباره امتحان کنید.",
          RESET_EXPIRED: "لینک منقضی یا استفاده شده؛ لینک جدید درخواست کنید.",
          INVALID_RESET: "رمز باید بین ۸ تا ۱۲۸ نویسه باشد.",
          INVALID_REQUEST: "ایمیل یا شماره همراه را درست وارد کنید.",
          EMAIL_SEND_FAILED: "ارسال ایمیل انجام نشد؛ دوباره امتحان کنید.",
          EMAIL_NOT_CONFIGURED: "ارسال ایمیل فعلاً در دسترس نیست.",
        };
        setMessage(errors[data.error] || "درخواست انجام نشد؛ دوباره امتحان کنید.");
        return;
      }
      if (token) {
        setDone(true);
        setPassword("");
        setConfirm("");
        setMessage("رمز جدید ذخیره شد؛ اکنون وارد شوید.");
      } else if (helpMode) {
        setDone(true);
        setMessage("درخواست پیگیری ثبت شد. این مسیر فوری نیست؛ پس از بررسی، از طریق پیامک یا تماس با شمارهٔ ثبت‌شده پیگیری می‌کنیم.");
      } else {
        setMessage("اگر ایمیل و شماره با حساب مطابقت داشته باشد، لینک بازیابی ارسال می‌شود. پوشهٔ اسپم را هم ببینید؛ لینک ۱۵ دقیقه معتبر است.");
      }
    } catch {
      setMessage("ارتباط برقرار نشد؛ اطلاعات شما حفظ شده، دوباره امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  const switchToHelp = () => {
    setHelpMode(true);
    setMessage("شمارهٔ همراه ثبت‌شده را وارد کنید تا درخواست پیگیری از طریق سامانهٔ پیامک خونه‌نما ثبت شود. این کار جای بازیابی فوری با ایمیل را نمی‌گیرد.");
  };

  return <form className="business-login-card glass-panel" onSubmit={submit}>
    <span className="section-kicker">بازیابی رمز</span>
    <h1>{token ? "انتخاب رمز جدید" : helpMode ? "پیگیری بدون دسترسی به ایمیل" : "بازیابی از طریق ایمیل"}</h1>
    <p>{token ? "رمز تازه‌ای انتخاب کنید که فقط خودتان می‌دانید." : helpMode ? "درخواست شما برای رسیدگی انسانی ثبت می‌شود؛ نتیجه در لحظه آماده نیست." : "ایمیل حساب را دقیق وارد کنید. ساده‌ترین و سریع‌ترین راه بازیابی رمز، دریافت لینک در ایمیل است؛ جیمیل هم یک ایمیل معتبر است."}</p>
    {token ? <>
      <label><span>رمز جدید</span><div className="form-input"><input type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={done} /></div></label>
      <label><span>تکرار رمز جدید</span><div className="form-input"><input type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={done} /></div></label>
    </> : <>
      {!helpMode && <label><span>ایمیل ثبت‌شده</span><div className="form-input"><input type="email" autoComplete="email" required maxLength={160} dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} /></div></label>}
      <label><span>شماره همراه ثبت‌شده</span><div className="form-input"><input type="tel" autoComplete="tel" required dir="ltr" inputMode="tel" placeholder="09…" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={done} /></div></label>
    </>}
    <button type="submit" className="register-submit" disabled={busy || done || (!token && !helpMode && !ready)}>{busy ? "در حال انجام…" : token ? "ذخیره رمز جدید" : helpMode ? "ثبت درخواست پیگیری پیامکی" : "ارسال لینک بازیابی"}</button>
    {!token && !helpMode && <button type="button" className="admin-login-entry" onClick={switchToHelp}>به ایمیل دسترسی ندارم</button>}
    {!token && helpMode && !done && <button type="button" className="admin-login-entry" onClick={() => { setHelpMode(false); setMessage(""); }}>بازگشت به بازیابی با ایمیل</button>}
    <div className="business-login-message" role="status" aria-live="polite">{message}</div>
    {token && !done && <a href="/business/forgot-password">درخواست لینک جدید</a>}
    <a className="admin-login-entry" href="/help">راهنما و پشتیبانی</a>
    <a className="admin-login-entry" href="/business/login">بازگشت به ورود</a>
  </form>;
}
