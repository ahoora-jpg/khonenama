"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Store,
  Upload,
  User,
} from "lucide-react";

type FormState = {
  ownerName: string;
  phone: string;
  email: string;
  businessType: "store" | "company" | "individual";
  businessName: string;
  category: string;
  city: string;
  area: string;
  address: string;
  instagram: string;
  website: string;
  services: string[];
  serviceAreas: string[];
  description: string;
  plan: "free" | "pro" | "premium";
};

const initialState: FormState = {
  ownerName: "",
  phone: "",
  email: "",
  businessType: "store",
  businessName: "",
  category: "curtain",
  city: "کرج",
  area: "",
  address: "",
  instagram: "",
  website: "",
  services: [],
  serviceAreas: [],
  description: "",
  plan: "free",
};

const categoryServices: Record<string, string[]> = {
  curtain: ["پرده زبرا", "پرده شید", "پرده پارچه‌ای", "اندازه‌گیری", "دوخت", "نصب"],
  flooring: ["پارکت", "لمینت", "PVC", "قرنیز", "زیرسازی", "نصب"],
  carpet: ["موکت رول", "موکت تایلی", "اندازه‌گیری", "نصب"],
  wallpaper: ["کاغذ دیواری", "پوستر دیواری", "دیوارپوش", "زیرسازی", "نصب"],
  "interior-design": ["طراحی داخلی", "طراحی سه‌بعدی", "انتخاب متریال", "نظارت", "اجرا"],
};

const areas = ["برغان", "عظیمیه", "جهانشهر", "گوهردشت", "مهرشهر", "کل کرج"];

const steps = [
  ["حساب", "اطلاعات مالک"],
  ["کسب‌وکار", "مشخصات اصلی"],
  ["خدمات", "دسته و محدوده"],
  ["رسانه", "معرفی و تصاویر"],
  ["تأیید", "مرور و انتشار"],
] as const;

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function BusinessOnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("khonenama-business-draft");
      if (raw) setForm({ ...initialState, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("khonenama-business-draft", JSON.stringify(form));
  }, [form]);

  const progress = ((step + 1) / steps.length) * 100;
  const availableServices = categoryServices[form.category] || [];

  const canContinue = useMemo(() => {
    if (step === 0) return form.ownerName.trim().length > 1 && form.phone.trim().length >= 10;
    if (step === 1) return form.businessName.trim().length > 1 && form.city.trim().length > 1;
    if (step === 2) return form.services.length > 0 && form.serviceAreas.length > 0;
    if (step === 3) return form.description.trim().length >= 20;
    return true;
  }, [form, step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function finish() {
    setSaved(true);
    localStorage.setItem(
      "khonenama-business-profile",
      JSON.stringify({
        ...form,
        status: "draft",
        completion: 72,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-progress-wrap">
        <div className="onboarding-progress-top">
          <strong>ساخت پروفایل کسب‌وکار</strong>
          <span>{step + 1} از {steps.length}</span>
        </div>
        <div className="onboarding-progress"><span style={{ width: progress + "%" }} /></div>
        <div className="onboarding-steps">
          {steps.map(([title, subtitle], index) => (
            <button
              type="button"
              className={index === step ? "is-active" : index < step ? "is-done" : ""}
              key={title}
              onClick={() => index <= step && setStep(index)}
            >
              <span>{index < step ? <Check size={13} /> : index + 1}</span>
              <div><strong>{title}</strong><small>{subtitle}</small></div>
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-card glass-panel">
        {step === 0 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۱</span>
            <h2>اول صاحب حساب را بشناسیم.</h2>
            <p>این اطلاعات برای مدیریت پروفایل استفاده می‌شود و شماره تماس بعداً با کد یک‌بارمصرف تأیید خواهد شد.</p>

            <div className="form-row two-columns">
              <label>
                <span>نام و نام خانوادگی</span>
                <div className="form-input"><User size={17} /><input value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="نام مدیر کسب‌وکار" /></div>
              </label>
              <label>
                <span>شماره همراه</span>
                <div className="form-input"><Phone size={17} /><input inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="09..." /></div>
              </label>
            </div>

            <div className="form-row two-columns">
              <label>
                <span>ایمیل (اختیاری)</span>
                <div className="form-input"><Mail size={17} /><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@example.com" /></div>
              </label>
              <label>
                <span>نوع فعالیت</span>
                <select value={form.businessType} onChange={(e) => update("businessType", e.target.value as FormState["businessType"])}>
                  <option value="store">فروشگاه</option>
                  <option value="company">شرکت</option>
                  <option value="individual">متخصص / شخص حقیقی</option>
                </select>
              </label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۲</span>
            <h2>مشخصات اصلی کسب‌وکار</h2>
            <p>این اطلاعات هسته پروفایل عمومی شما را می‌سازند.</p>

            <div className="form-row two-columns">
              <label>
                <span>نام کسب‌وکار</span>
                <div className="form-input"><Building2 size={17} /><input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="مثلاً پرده‌سرای ..." /></div>
              </label>
              <label>
                <span>دسته اصلی</span>
                <select value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="curtain">پرده و متعلقات</option>
                  <option value="flooring">کفپوش و پارکت</option>
                  <option value="carpet">موکت</option>
                  <option value="wallpaper">کاغذ دیواری</option>
                  <option value="interior-design">طراحی داخلی</option>
                </select>
              </label>
            </div>

            <div className="form-row two-columns">
              <label>
                <span>شهر</span>
                <div className="form-input"><MapPin size={17} /><input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
              </label>
              <label>
                <span>محله / محدوده</span>
                <div className="form-input"><MapPin size={17} /><input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="مثلاً برغان" /></div>
              </label>
            </div>

            <label className="form-row">
              <span>آدرس</span>
              <textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="آدرس فروشگاه، دفتر یا کارگاه" />
            </label>

            <div className="form-row two-columns">
              <label>
                <span>اینستاگرام</span>
                <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@username" />
              </label>
              <label>
                <span>وب‌سایت</span>
                <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۳</span>
            <h2>چه خدماتی می‌دهید و کجا کار می‌کنید؟</h2>
            <p>این داده‌ها بعداً برای جستجوی محلی و تطبیق درخواست مشتری استفاده می‌شوند.</p>

            <div className="choice-block">
              <strong>خدمات</strong>
              <div className="choice-grid">
                {availableServices.map((service) => (
                  <button
                    type="button"
                    className={form.services.includes(service) ? "choice-chip is-selected" : "choice-chip"}
                    key={service}
                    onClick={() => update("services", toggleValue(form.services, service))}
                  >
                    {form.services.includes(service) && <Check size={13} />}
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <div className="choice-block">
              <strong>محدوده فعالیت</strong>
              <div className="choice-grid">
                {areas.map((area) => (
                  <button
                    type="button"
                    className={form.serviceAreas.includes(area) ? "choice-chip is-selected" : "choice-chip"}
                    key={area}
                    onClick={() => update("serviceAreas", toggleValue(form.serviceAreas, area))}
                  >
                    {form.serviceAreas.includes(area) && <Check size={13} />}
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۴</span>
            <h2>پروفایل را زنده و تصویری کن.</h2>
            <p>فعلاً پیش‌نمایش رابط آماده است؛ آپلود واقعی بعد از اتصال R2 فعال می‌شود.</p>

            <label className="form-row">
              <span>معرفی کوتاه</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="تخصص، سابقه، نوع پروژه‌ها و مزیت اصلی کسب‌وکارتان را در چند جمله بنویسید."
              />
              <small className="field-hint">حداقل ۲۰ کاراکتر؛ از تکرار کلمات تبلیغاتی بدون توضیح واقعی خودداری کنید.</small>
            </label>

            <div className="media-upload-grid">
              <button type="button" className="media-upload-tile">
                <Upload size={22} /><strong>لوگو</strong><small>مربع، ترجیحاً PNG/WebP</small>
              </button>
              <button type="button" className="media-upload-tile">
                <Camera size={22} /><strong>کاور پروفایل</strong><small>تصویر واقعی فروشگاه یا پروژه</small>
              </button>
              <button type="button" className="media-upload-tile">
                <Camera size={22} /><strong>نمونه‌کارها</strong><small>حداقل ۳ تصویر پیشنهاد می‌شود</small>
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۵</span>
            <h2>مرور نهایی و انتخاب پلن</h2>
            <p>پلن پایه رایگان است. ارتقا به پلن‌های پولی بعداً از داخل پنل انجام می‌شود.</p>

            <div className="onboarding-review-grid">
              <div><span>کسب‌وکار</span><strong>{form.businessName || "—"}</strong></div>
              <div><span>مدیر</span><strong>{form.ownerName || "—"}</strong></div>
              <div><span>موقعیت</span><strong>{[form.city, form.area].filter(Boolean).join("، ") || "—"}</strong></div>
              <div><span>خدمات</span><strong>{form.services.length ? form.services.join("، ") : "—"}</strong></div>
            </div>

            <div className="plan-choice-row">
              <button type="button" className={form.plan === "free" ? "plan-choice is-selected" : "plan-choice"} onClick={() => update("plan", "free")}>
                <span>پایه</span><strong>رایگان</strong><small>شروع و انتشار پروفایل</small>
              </button>
              <button type="button" className={form.plan === "pro" ? "plan-choice is-selected" : "plan-choice"} onClick={() => update("plan", "pro")}>
                <span>حرفه‌ای</span><strong>پس از فعال‌سازی</strong><small>آمار و ابزارهای بیشتر</small>
              </button>
              <button type="button" className={form.plan === "premium" ? "plan-choice is-selected" : "plan-choice"} onClick={() => update("plan", "premium")}>
                <span>ویژه</span><strong>پس از فعال‌سازی</strong><small>تبلیغات و دیده‌شدن بیشتر</small>
              </button>
            </div>

            {saved && (
              <div className="onboarding-success">
                <CheckCircle2 size={22} />
                <div><strong>پیش‌نویس پروفایل ذخیره شد.</strong><small>در نسخه فعلی داده روی مرورگر نگه داشته می‌شود تا اتصال D1 و احراز هویت کامل شود.</small></div>
              </div>
            )}
          </section>
        )}

        <div className="onboarding-actions">
          <button type="button" className="pill-button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            <ArrowRight size={16} /> قبلی
          </button>

          {step < steps.length - 1 ? (
            <button type="button" className="pill-button dark" disabled={!canContinue} onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
              ادامه <ArrowLeft size={16} />
            </button>
          ) : (
            <button type="button" className="pill-button dark" onClick={finish}>
              ذخیره پیش‌نویس <Store size={16} />
            </button>
          )}
        </div>

        {step === steps.length - 1 && saved && (
          <a className="onboarding-dashboard-link" href="/dashboard">رفتن به پنل مدیریت کسب‌وکار <ArrowLeft size={15} /></a>
        )}
      </div>
    </div>
  );
}
