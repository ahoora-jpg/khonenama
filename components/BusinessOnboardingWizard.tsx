"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, CheckCircle2, LockKeyhole, MapPin, Phone, Store } from "lucide-react";
import { BUSINESS_CATEGORIES, servicesForCategories } from "@/lib/business-taxonomy";
import BusinessMediaManager from "@/components/BusinessMediaManager";

type Form = { phone: string; password: string; businessName: string; city: string; category: string; service: string; businessType: "store" | "company" | "individual" };
const initial: Form = { phone: "", password: "", businessName: "", city: "", category: "", service: "", businessType: "store" };
const apiErrors: Record<string, string> = {
  INVALID_EXISTING_PASSWORD: "این شماره قبلاً در خونه‌نما ثبت شده است. با رمز همان حساب وارد شوید یا رمزتان را بازیابی کنید.",
  PHONE_IN_USE: "این شماره قبلاً ثبت شده است. وارد حساب شوید یا رمز را بازیابی کنید.",
  INVALID_PHONE: "شماره همراه صحیح نیست.", PASSWORD_TOO_SHORT: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
  INVALID_CATEGORY: "یک دسته فعالیت معتبر انتخاب کنید.", INCOMPLETE_PROFILE: "دسته، خدمت اصلی و شهر را بررسی کنید.",
};
function digits(value: string) { return value.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[\s-]/g, ""); }

export default function BusinessOnboardingWizard() {
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ slug: string; status: string } | null>(null);
  const tracked = useRef(new Set<string>());
  const category = BUSINESS_CATEGORIES.find((item) => item.slug === form.category);
  const services = useMemo(() => form.category ? servicesForCategories([form.category]) : [], [form.category]);
  const validPhone = /^09\d{9}$/.test(digits(form.phone));
  const ready = validPhone && form.password.length >= 8 && form.businessName.trim().length >= 2 && form.city.trim().length >= 2 && Boolean(form.category) && Boolean(form.service);

  function track(event: "registration_view" | "registration_submit_attempt" | "registration_submit_failed") {
    if (tracked.current.has(event) || navigator.doNotTrack === "1") return;
    tracked.current.add(event);
    fetch("/api/seller-acquisition", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }), keepalive: true }).catch(() => undefined);
  }
  useEffect(() => { track("registration_view"); }, []);
  function update<Key extends keyof Form>(key: Key, value: Form[Key]) { setForm((current) => ({ ...current, [key]: value })); }
  function invalidMessage() {
    if (!validPhone) return "شماره همراه را به‌صورت ۰۹xxxxxxxxx وارد کنید.";
    if (form.password.length < 8) return "رمز عبور باید حداقل ۸ کاراکتر باشد.";
    if (form.businessName.trim().length < 2) return "نام کسب‌وکارتان را وارد کنید.";
    if (form.city.trim().length < 2) return "شهر را وارد کنید.";
    return !form.category ? "یک دسته فعالیت انتخاب کنید." : "یک خدمت اصلی انتخاب کنید.";
  }
  async function submit() {
    setError(""); track("registration_submit_attempt");
    if (!ready) { setError(invalidMessage()); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/businesses/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, mode: "quick", categories: [form.category], services: [form.service] }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(apiErrors[result.error] || "ساخت غرفه انجام نشد؛ کمی بعد دوباره تلاش کنید.");
      setSaved({ slug: result.business.slug, status: result.business.status });
    } catch (reason) { track("registration_submit_failed"); setError(reason instanceof Error ? reason.message : "ساخت غرفه انجام نشد."); }
    finally { setBusy(false); }
  }
  if (saved) return <section className="onboarding-shell onboarding-success-fast">
    <CheckCircle2 size={34} aria-hidden="true" /><span className="section-kicker">غرفه آماده است</span><h2>غرفه شما ساخته شد ✅</h2>
    <p>{saved.status === "published" ? "غرفه شما همین حالا قابل مشاهده است. برای بهتر دیده‌شدن، یک عکس واقعی اضافه کنید." : "غرفه ذخیره شد و پس از بررسی دسته یا خدمت پیشنهادی منتشر می‌شود."}</p>
    {saved.status === "published" && <a className="pill-button" target="_blank" rel="noreferrer" href={`/business/${saved.slug}`}>مشاهده غرفه من</a>}
    <h3>اولین قدم پیشنهادی</h3><p>یک عکس واقعی از کسب‌وکارتان انتخاب کنید؛ اطلاعات بیشتر را هر زمان خواستید اضافه می‌کنید.</p>
    <BusinessMediaManager plan="free" mode="first-photo" />
    <div className="onboarding-next-steps"><span>۱. یک عکس واقعی اضافه کن</span><span>۲. معرفی غرفه را کامل کن</span><span>۳. محدوده و اطلاعات تماس را دقیق‌تر کن</span></div>
  </section>;
  return <section className="onboarding-shell quick-booth-form">
    <span className="section-kicker">ساخت رایگان غرفه</span><h2>فقط اطلاعات اصلی را وارد کنید.</h2><p>عکس و جزئیات بیشتر را هر زمان خواستید اضافه می‌کنید.</p>
    <div className="form-row"><label><span>شماره همراه</span><div className="form-input"><Phone size={17} /><input inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="۰۹..." /></div></label></div>
    <div className="form-row"><label><span>رمز عبور</span><div className="form-input"><LockKeyhole size={17} /><input type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="حداقل ۸ کاراکتر" /></div></label></div>
    <div className="form-row"><label><span>نام کسب‌وکار</span><div className="form-input"><Building2 size={17} /><input autoComplete="organization" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="مثلاً پرده‌سرای ..." /></div></label></div>
    <div className="form-row"><label><span>شهر</span><div className="form-input"><MapPin size={17} /><input autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="مثلاً اصفهان" /></div></label></div>
    <div className="choice-block"><strong>نوع فعالیت</strong><div className="category-choice-grid">{([ ["store", "فروشگاه"], ["company", "شرکت طراحی و اجرا"], ["individual", "نصاب یا متخصص"] ] as const).map(([value, label]) => <button type="button" key={value} className={form.businessType === value ? "category-choice-card is-selected" : "category-choice-card"} onClick={() => update("businessType", value)}>{label}</button>)}</div></div>
    <div className="choice-block"><strong>دسته فعالیت</strong><div className="category-choice-grid">{BUSINESS_CATEGORIES.map((item) => <button type="button" key={item.slug} className={form.category === item.slug ? "category-choice-card is-selected" : "category-choice-card"} onClick={() => { update("category", item.slug); update("service", ""); }}>{item.label}</button>)}</div></div>
    {category && <div className="choice-block"><strong>خدمت اصلی در {category.label}</strong><div className="service-chips">{services.map((service) => <button type="button" className={form.service === service ? "is-selected" : ""} key={service} onClick={() => update("service", service)}>{service}</button>)}</div></div>}
    <p className="field-hint">با ساخت غرفه، محدوده فعالیت شما «تمام {form.city || "شهر"}» ثبت می‌شود و بعداً قابل ویرایش است.</p>
    {error && <p className="onboarding-error" role="alert">{error}</p>}
    <button type="button" className="pill-button dark" disabled={busy} onClick={submit}>{busy ? "در حال ساخت غرفه…" : "ساخت رایگان غرفه"}<Store size={17} /></button>
  </section>;
}
