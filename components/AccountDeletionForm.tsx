"use client";

import { useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

export default function AccountDeletionForm() {
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [reason, setReason] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (!/^09\d{9}$/.test(phone.replace(/\D/g, ""))) {
      setMessage("شماره موبایل را به شکل ۱۱ رقمی و با ۰۹ وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone, businessName, reason, companyWebsite }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error === "INVALID_PHONE" ? "شماره موبایل معتبر نیست." : "ثبت درخواست فعلاً ممکن نیست؛ دوباره تلاش کنید.");
      setSuccess(true);
      setMessage(`درخواست ثبت شد. کد پیگیری: ${result.requestId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای پیش‌بینی‌نشده رخ داد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-deletion-form" onSubmit={submit}>
      <label className="form-input">
        <span>شماره موبایل حساب</span>
        <input dir="ltr" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09123456789" required />
      </label>
      <label className="form-input">
        <span>نام کسب‌وکار</span>
        <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="برای تطبیق سریع‌تر" />
      </label>
      <label className="form-input account-deletion-honeypot" aria-hidden="true">
        <span>وب‌سایت شرکت</span>
        <input tabIndex={-1} autoComplete="off" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} />
      </label>
      <label className="form-input">
        <span>توضیح اختیاری</span>
        <textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="مثلاً حذف کامل حساب یا فقط غیرفعال‌کردن پروفایل عمومی" />
      </label>
      <button className="pill-button dark" type="submit" disabled={busy}>
        <Trash2 size={17} /> {busy ? "در حال ثبت..." : "ثبت درخواست حذف حساب"}
      </button>
      {message ? <p className={success ? "account-deletion-message is-success" : "account-deletion-message"} role="status">{success && <CheckCircle2 size={16} />}{message}</p> : null}
    </form>
  );
}
