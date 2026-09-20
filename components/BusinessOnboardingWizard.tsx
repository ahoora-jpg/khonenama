"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Plus,
  Phone,
  Store,
  Upload,
  User,
} from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORY_BY_SLUG,
  servicesForCategories,
} from "@/lib/business-taxonomy";
import {
  KARAJ_POPULAR_AREAS,
  suggestKarajAreas,
} from "@/lib/karaj-areas";

type FormState = {
  ownerName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessType: "store" | "company" | "individual";
  businessName: string;
  categories: string[];
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
  password: "",
  confirmPassword: "",
  businessType: "store",
  businessName: "",
  categories: [],
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

const steps = [
  ["حساب", "اطلاعات مالک و رمز"],
  ["کسب‌وکار", "مشخصات و دسته‌ها"],
  ["خدمات", "تخصص و محدوده"],
  ["رسانه", "معرفی و تصاویر"],
  ["تأیید", "مرور و ثبت"],
] as const;

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export default function BusinessOnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serviceAreaQuery, setServiceAreaQuery] = useState("");
  const [profileAreaOpen, setProfileAreaOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("khonenama-business-draft");
      if (!raw) return;

      const draft = JSON.parse(raw);
      const legacyCategories = Array.isArray(draft.categories)
        ? draft.categories
        : draft.category
          ? [draft.category]
          : [];

      setForm({
        ...initialState,
        ...draft,
        categories: legacyCategories,
        password: "",
        confirmPassword: "",
      });
    } catch {}
  }, []);

  useEffect(() => {
    const { password, confirmPassword, ...safeDraft } = form;
    localStorage.setItem("khonenama-business-draft", JSON.stringify(safeDraft));
  }, [form]);

  const progress = ((step + 1) / steps.length) * 100;
  const availableServices = useMemo(
    () => servicesForCategories(form.categories),
    [form.categories]
  );

  const profileAreaSuggestions = useMemo(
    () => suggestKarajAreas(form.area, 8),
    [form.area]
  );

  const serviceAreaSuggestions = useMemo(
    () => suggestKarajAreas(serviceAreaQuery, 10),
    [serviceAreaQuery]
  );

  const canContinue = useMemo(() => {
    if (step === 0) {
      return (
        form.ownerName.trim().length > 1 &&
        form.phone.trim().length >= 10 &&
        form.password.length >= 8 &&
        form.password === form.confirmPassword
      );
    }
    if (step === 1) {
      return (
        form.businessName.trim().length > 1 &&
        form.city.trim().length > 1 &&
        form.categories.length > 0
      );
    }
    if (step === 2) {
      return form.services.length > 0 && form.serviceAreas.length > 0;
    }
    if (step === 3) return form.description.trim().length >= 20;
    return true;
  }, [form, step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleCategory(slug: string) {
    setForm((current) => {
      const categories = toggleValue(current.categories, slug);
      const allowed = new Set(servicesForCategories(categories));
      return {
        ...current,
        categories,
        services: current.services.filter((service) => allowed.has(service)),
      };
    });
  }

  function addServiceArea(value: string) {
    const area = value.trim();
    if (!area) return;
    setForm((current) => ({
      ...current,
      serviceAreas: unique([...current.serviceAreas, area]),
    }));
    setServiceAreaQuery("");
  }

  async function finish() {
    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/businesses/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const raw = await response.text();
      let result: any = {};
      try {
        result = raw ? JSON.parse(raw) : {};
      } catch {
        result = { error: "NON_JSON_RESPONSE", detail: raw.slice(0, 160) };
      }

      if (!response.ok || !result?.ok) {
        const messages: Record<string, string> = {
          INVALID_PHONE: "شماره همراه را به‌صورت 09xxxxxxxxx وارد کنید.",
          INVALID_EMAIL: "فرمت ایمیل صحیح نیست.",
          PASSWORD_TOO_SHORT: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
          PASSWORD_TOO_LONG: "رمز عبور بیش از حد طولانی است.",
          INVALID_EXISTING_PASSWORD: "این شماره قبلاً ثبت شده است؛ رمز همان حساب را وارد کنید.",
          INVALID_REQUIRED_FIELDS: "اطلاعات ضروری را کامل کنید.",
          INCOMPLETE_PROFILE: "خدمات، محدوده فعالیت و معرفی کسب‌وکار را کامل کنید.",
          D1_BINDING_NOT_AVAILABLE: "اتصال دیتابیس در محیط اجرا فعال نیست.",
          INVALID_CATEGORY: "حداقل یک دسته فعالیت انتخاب کنید.",
          CATEGORY_NOT_FOUND: "یکی از دسته‌های انتخاب‌شده در دیتابیس پیدا نشد.",
          EMAIL_IN_USE: "این ایمیل قبلاً برای حساب دیگری ثبت شده است. با همان حساب وارد شوید یا ایمیل دیگری وارد کنید.",
          PHONE_IN_USE: "این شماره همراه قبلاً ثبت شده است.",
          PASSWORD_SCHEMA_REQUIRED: "بخش ورود با رمز هنوز در دیتابیس فعال نشده است.",
          DB_SCHEMA_OUTDATED: "ساختار دیتابیس هنوز کامل نیست؛ لطفاً دوباره تلاش کنید.",
        };

        const stageLabels: Record<string, string> = {
          "parse-request": "خواندن فرم",
          "category-lookup": "بررسی دسته‌ها",
          "user-lookup": "بررسی حساب",
          "password-check": "بررسی رمز عبور",
          "user-save": "ذخیره حساب",
          "business-create": "ساخت کسب‌وکار",
          "business-relations": "اتصال دسته و محدوده",
          "services-save": "ذخیره خدمات",
          "subscription-save": "ساخت اشتراک",
          "session-create": "ساخت نشست ورود",
        };

        const fallback =
          result?.error === "NON_JSON_RESPONSE"
            ? "پاسخ سرور قابل خواندن نبود. کد HTTP: " + response.status
            : "ذخیره اطلاعات انجام نشد. کد HTTP: " +
              response.status +
              (result?.stage
                ? " — مرحله: " + (stageLabels[result.stage] || result.stage)
                : "");

        throw new Error(messages[result?.error] || fallback);
      }

      const storedProfile = {
        ownerName: form.ownerName,
        phone: form.phone,
        email: form.email,
        businessType: form.businessType,
        businessName: form.businessName,
        categories: form.categories,
        city: form.city,
        area: form.area,
        address: form.address,
        instagram: form.instagram,
        website: form.website,
        services: form.services,
        serviceAreas: form.serviceAreas,
        description: form.description,
        plan: form.plan,
        businessId: result.business.id,
        businessSlug: result.business.slug,
        ownerUserId: result.owner.id,
        status: result.business.status,
        verificationStatus: result.business.verificationStatus,
        completion: 78,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "khonenama-business-profile",
        JSON.stringify(storedProfile)
      );
      localStorage.removeItem("khonenama-business-draft");
      setSaved(true);
      update("password", "");
      update("confirmPassword", "");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "ذخیره اطلاعات انجام نشد."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-progress-wrap">
        <div className="onboarding-progress-top">
          <strong>ساخت پروفایل کسب‌وکار</strong>
          <span>{step + 1} از {steps.length}</span>
        </div>
        <div className="onboarding-progress">
          <span style={{ width: progress + "%" }} />
        </div>

        <div className="onboarding-steps">
          {steps.map(([title, subtitle], index) => (
            <button
              type="button"
              className={
                index === step ? "is-active" : index < step ? "is-done" : ""
              }
              key={title}
              onClick={() => index <= step && setStep(index)}
            >
              <span>{index < step ? <Check size={13} /> : index + 1}</span>
              <div>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-card glass-panel">
        {step === 0 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۱</span>
            <h2>حساب صاحب کسب‌وکار</h2>
            <p>
              شماره همراه و رمز عبور برای ورود روزمره به پنل استفاده می‌شوند.
              بازیابی رمز بعداً از طریق ایمیل و در صورت نیاز پیامک انجام می‌شود.
            </p>

            <div className="form-row two-columns">
              <label>
                <span>نام و نام خانوادگی</span>
                <div className="form-input">
                  <User size={17} />
                  <input
                    value={form.ownerName}
                    onChange={(e) => update("ownerName", e.target.value)}
                    placeholder="نام مدیر کسب‌وکار"
                  />
                </div>
              </label>

              <label>
                <span>شماره همراه</span>
                <div className="form-input">
                  <Phone size={17} />
                  <input
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="09..."
                  />
                </div>
              </label>
            </div>

            <div className="form-row two-columns">
              <label>
                <span>ایمیل بازیابی (اختیاری)</span>
                <div className="form-input">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </label>

              <label>
                <span>نوع فعالیت</span>
                <select
                  value={form.businessType}
                  onChange={(e) =>
                    update(
                      "businessType",
                      e.target.value as FormState["businessType"]
                    )
                  }
                >
                  <option value="store">فروشگاه</option>
                  <option value="company">شرکت</option>
                  <option value="individual">متخصص / شخص حقیقی</option>
                </select>
              </label>
            </div>

            <div className="form-row two-columns">
              <label>
                <span>رمز عبور</span>
                <div className="form-input">
                  <LockKeyhole size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    autoComplete="new-password"
                    placeholder="حداقل ۸ کاراکتر"
                  />
                  <button
                    className="password-visibility"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label="نمایش یا پنهان‌کردن رمز"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label>
                <span>تکرار رمز عبور</span>
                <div className="form-input">
                  <LockKeyhole size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                    placeholder="رمز را دوباره وارد کنید"
                  />
                </div>
                {form.confirmPassword &&
                  form.password !== form.confirmPassword && (
                    <small className="field-error">دو رمز یکسان نیستند.</small>
                  )}
              </label>
            </div>

            <small className="field-hint">
              رمز عبور در مرورگر ذخیره نمی‌شود و فقط به‌صورت هش‌شده در سرور نگهداری خواهد شد.
            </small>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۲</span>
            <h2>مشخصات اصلی کسب‌وکار</h2>
            <p>
              یک کسب‌وکار می‌تواند هم‌زمان در چند حوزه فعالیت کند؛ هر مورد مرتبط را انتخاب کنید.
            </p>

            <label className="form-row">
              <span>نام کسب‌وکار</span>
              <div className="form-input">
                <Building2 size={17} />
                <input
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="مثلاً خانه دکور ..."
                />
              </div>
            </label>

            <div className="choice-block">
              <strong>دسته‌های فعالیت</strong>
              <div className="category-choice-grid">
                {BUSINESS_CATEGORIES.map((category) => (
                  <button
                    type="button"
                    className={
                      form.categories.includes(category.slug)
                        ? "category-choice-card is-selected"
                        : "category-choice-card"
                    }
                    key={category.slug}
                    onClick={() => toggleCategory(category.slug)}
                  >
                    <span className="category-choice-check">
                      {form.categories.includes(category.slug) && (
                        <Check size={14} />
                      )}
                    </span>
                    <strong>{category.label}</strong>
                  </button>
                ))}
              </div>
              <small className="field-hint">
                می‌توانید چند گزینه را هم‌زمان انتخاب کنید؛ مثلاً پرده، موکت، کفپوش و کاغذ دیواری.
              </small>
            </div>

            <div className="form-row two-columns">
              <label>
                <span>شهر</span>
                <div className="form-input">
                  <MapPin size={17} />
                  <input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </div>
              </label>

              <label className="autocomplete-field">
                <span>محله / محدوده اصلی</span>
                <div className="form-input">
                  <MapPin size={17} />
                  <input
                    value={form.area}
                    onChange={(e) => {
                      update("area", e.target.value);
                      setProfileAreaOpen(true);
                    }}
                    onFocus={() => setProfileAreaOpen(true)}
                    onBlur={() => window.setTimeout(() => setProfileAreaOpen(false), 120)}
                    placeholder="مثلاً بر..."
                    autoComplete="off"
                  />
                </div>
                {profileAreaOpen && form.area.trim().length > 0 && profileAreaSuggestions.length > 0 && (
                  <div className="area-suggestions">
                    {profileAreaSuggestions.map((area) => (
                      <button
                        type="button"
                        key={area}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          update("area", area);
                          setProfileAreaOpen(false);
                        }}
                      >
                        <MapPin size={13} /> {area}
                      </button>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <label className="form-row">
              <span>آدرس</span>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="آدرس فروشگاه، دفتر یا کارگاه"
              />
            </label>

            <div className="form-row two-columns">
              <label>
                <span>اینستاگرام</span>
                <input
                  value={form.instagram}
                  onChange={(e) => update("instagram", e.target.value)}
                  placeholder="@username"
                />
              </label>
              <label>
                <span>وب‌سایت</span>
                <input
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۳</span>
            <h2>خدمات و محدوده فعالیت</h2>
            <p>
              خدمات بر اساس همه دسته‌هایی که انتخاب کرده‌اید نمایش داده می‌شوند؛ بنابراین فروشگاه چندمنظوره محدود به یک حوزه نیست.
            </p>

            {form.categories.map((slug) => {
              const category =
                BUSINESS_CATEGORY_BY_SLUG[
                  slug as keyof typeof BUSINESS_CATEGORY_BY_SLUG
                ];
              if (!category) return null;

              return (
                <div className="choice-block service-category-block" key={slug}>
                  <strong>{category.label}</strong>
                  <div className="choice-grid">
                    {category.services.map((service) => (
                      <button
                        type="button"
                        className={
                          form.services.includes(service)
                            ? "choice-chip is-selected"
                            : "choice-chip"
                        }
                        key={service}
                        onClick={() =>
                          update(
                            "services",
                            toggleValue(form.services, service)
                          )
                        }
                      >
                        {form.services.includes(service) && (
                          <Check size={13} />
                        )}
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {!availableServices.length && (
              <div className="onboarding-error">
                ابتدا در مرحله قبل حداقل یک دسته فعالیت انتخاب کنید.
              </div>
            )}

            <div className="choice-block">
              <strong>محدوده‌های فعالیت</strong>

              <div className="service-area-input-row">
                <div className="autocomplete-field service-area-autocomplete">
                  <div className="form-input">
                    <MapPin size={17} />
                    <input
                      value={serviceAreaQuery}
                      onChange={(e) => setServiceAreaQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addServiceArea(serviceAreaQuery);
                        }
                      }}
                      placeholder="نام محله را تایپ کنید؛ مثلاً بر..."
                      autoComplete="off"
                    />
                  </div>

                  {serviceAreaQuery.trim().length > 0 &&
                    serviceAreaSuggestions.length > 0 && (
                      <div className="area-suggestions">
                        {serviceAreaSuggestions.map((area) => (
                          <button
                            type="button"
                            key={area}
                            onClick={() => addServiceArea(area)}
                          >
                            <MapPin size={13} /> {area}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <button
                  className="pill-button"
                  type="button"
                  onClick={() => addServiceArea(serviceAreaQuery)}
                  disabled={!serviceAreaQuery.trim()}
                >
                  <Plus size={15} /> افزودن
                </button>
              </div>

              <div className="choice-grid popular-area-grid">
                {KARAJ_POPULAR_AREAS.map((area) => (
                  <button
                    type="button"
                    className={
                      form.serviceAreas.includes(area)
                        ? "choice-chip is-selected"
                        : "choice-chip"
                    }
                    key={area}
                    onClick={() =>
                      update(
                        "serviceAreas",
                        toggleValue(form.serviceAreas, area)
                      )
                    }
                  >
                    {form.serviceAreas.includes(area) && <Check size={13} />}
                    {area}
                  </button>
                ))}
              </div>

              {form.serviceAreas.length > 0 && (
                <div className="selected-area-list">
                  {form.serviceAreas.map((area) => (
                    <button
                      type="button"
                      key={area}
                      onClick={() =>
                        update(
                          "serviceAreas",
                          form.serviceAreas.filter((item) => item !== area)
                        )
                      }
                      title="حذف محدوده"
                    >
                      {area} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۴</span>
            <h2>پروفایل را زنده و تصویری کن.</h2>
            <p>
              توضیح واقعی و دقیق بنویسید. آپلود عکس بعد از فعال‌شدن فضای ذخیره‌سازی رسانه وصل می‌شود.
            </p>

            <label className="form-row">
              <span>معرفی کوتاه</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="تخصص، سابقه، نوع پروژه‌ها و مزیت اصلی کسب‌وکارتان را در چند جمله بنویسید."
              />
              <small className="field-hint">
                حداقل ۲۰ کاراکتر؛ از تکرار کلمات تبلیغاتی بدون توضیح واقعی خودداری کنید.
              </small>
            </label>

            <div className="media-upload-grid">
              <button type="button" className="media-upload-tile">
                <Upload size={22} />
                <strong>لوگو</strong>
                <small>مربع، ترجیحاً PNG/WebP</small>
              </button>
              <button type="button" className="media-upload-tile">
                <Camera size={22} />
                <strong>کاور پروفایل</strong>
                <small>تصویر واقعی فروشگاه یا پروژه</small>
              </button>
              <button type="button" className="media-upload-tile">
                <Camera size={22} />
                <strong>نمونه‌کارها</strong>
                <small>حداقل ۳ تصویر پیشنهاد می‌شود</small>
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="onboarding-step">
            <span className="section-kicker">مرحله ۵</span>
            <h2>مرور نهایی و انتخاب پلن</h2>
            <p>
              پلن پایه رایگان است. ارتقا به پلن‌های پولی بعداً از داخل پنل انجام می‌شود.
            </p>

            <div className="onboarding-review-grid">
              <div>
                <span>کسب‌وکار</span>
                <strong>{form.businessName || "—"}</strong>
              </div>
              <div>
                <span>مدیر</span>
                <strong>{form.ownerName || "—"}</strong>
              </div>
              <div>
                <span>موقعیت</span>
                <strong>
                  {[form.city, form.area].filter(Boolean).join("، ") || "—"}
                </strong>
              </div>
              <div>
                <span>دسته‌ها</span>
                <strong>
                  {form.categories.length
                    ? form.categories
                        .map(
                          (slug) =>
                            BUSINESS_CATEGORY_BY_SLUG[
                              slug as keyof typeof BUSINESS_CATEGORY_BY_SLUG
                            ]?.label || slug
                        )
                        .join("، ")
                    : "—"}
                </strong>
              </div>
              <div>
                <span>خدمات</span>
                <strong>
                  {form.services.length ? form.services.join("، ") : "—"}
                </strong>
              </div>
              <div>
                <span>محدوده فعالیت</span>
                <strong>
                  {form.serviceAreas.length
                    ? form.serviceAreas.join("، ")
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="plan-choice-row">
              <button
                type="button"
                className={
                  form.plan === "free"
                    ? "plan-choice is-selected"
                    : "plan-choice"
                }
                onClick={() => update("plan", "free")}
              >
                <span>پایه</span>
                <strong>رایگان</strong>
                <small>شروع و انتشار پروفایل</small>
              </button>
              <button
                type="button"
                className={
                  form.plan === "pro"
                    ? "plan-choice is-selected"
                    : "plan-choice"
                }
                onClick={() => update("plan", "pro")}
              >
                <span>حرفه‌ای</span>
                <strong>پس از فعال‌سازی</strong>
                <small>آمار و ابزارهای بیشتر</small>
              </button>
              <button
                type="button"
                className={
                  form.plan === "premium"
                    ? "plan-choice is-selected"
                    : "plan-choice"
                }
                onClick={() => update("plan", "premium")}
              >
                <span>ویژه</span>
                <strong>پس از فعال‌سازی</strong>
                <small>تبلیغات و دیده‌شدن بیشتر</small>
              </button>
            </div>

            {saved && (
              <div className="onboarding-success">
                <CheckCircle2 size={22} />
                <div>
                  <strong>پروفایل در دیتابیس خونه‌نما ذخیره شد.</strong>
                  <small>
                    حساب شما از این پس با شماره همراه و رمز عبور قابل ورود است.
                  </small>
                </div>
              </div>
            )}
            {saveError && (
              <div className="onboarding-error">{saveError}</div>
            )}
          </section>
        )}

        <div className="onboarding-actions">
          <button
            type="button"
            className="pill-button"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            <ArrowRight size={16} /> قبلی
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              className="pill-button dark"
              disabled={!canContinue}
              onClick={() =>
                setStep((value) => Math.min(steps.length - 1, value + 1))
              }
            >
              ادامه <ArrowLeft size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="pill-button dark"
              onClick={finish}
              disabled={saving || saved}
            >
              {saving
                ? "در حال ذخیره..."
                : saved
                  ? "ذخیره شد"
                  : "ذخیره در خونه‌نما"}{" "}
              <Store size={16} />
            </button>
          )}
        </div>

        {step === steps.length - 1 && saved && (
          <a className="onboarding-dashboard-link" href="/dashboard">
            رفتن به پنل مدیریت کسب‌وکار <ArrowLeft size={15} />
          </a>
        )}
      </div>
    </div>
  );
}
