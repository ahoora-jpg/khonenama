"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Save, Store } from "lucide-react";
import BusinessHoursEditor from "@/components/BusinessHoursEditor";
import BusinessTaxonomyEditor from "@/components/BusinessTaxonomyEditor";

type ProfileForm = {
  name: string;
  description: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
};

const emptyForm: ProfileForm = {
  name: "",
  description: "",
  city: "",
  area: "",
  address: "",
  phone: "",
  whatsapp: "",
  website: "",
  instagram: "",
};

export default function BusinessProfileEditor() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/me/business", { cache: "no-store" });
        if (response.status === 401) {
          window.location.replace("/business/login?next=/dashboard/profile");
          return;
        }
        const result = await response.json();
        if (!response.ok || !result?.ok) throw new Error("SESSION_REQUIRED");

        if (!cancelled) {
          const business = result.business;
          setForm({
            name: business.name || "",
            description: business.description || "",
            city: business.city || "",
            area: business.area || "",
            address: business.address || "",
            phone: business.phone || "",
            whatsapp: business.whatsapp || "",
            website: business.website || "",
            instagram: business.instagram || "",
          });
        }
      } catch {
        if (!cancelled) {
          setError("برای ویرایش امن پروفایل باید Session پنل فعال باشد. پس از اعمال مرحله اتصال Session، صفحه خودکار به D1 وصل می‌شود.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/me/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "SAVE_FAILED");
      }

      setMessage("اطلاعات پروفایل در دیتابیس خونه‌نما ذخیره شد.");
    } catch {
      setError("ذخیره انجام نشد. اطلاعات ضروری را کامل کنید یا دوباره وارد پنل شوید.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-panel glass-panel profile-editor-loading">
        <Loader2 size={20} className="spin" />
        <span>در حال خواندن پروفایل از دیتابیس...</span>
      </div>
    );
  }

  return (
    <div className="business-profile-editor">
      <div className="dashboard-heading">
        <div>
          <span className="section-kicker">مدیریت پروفایل</span>
          <h1>ویرایش اطلاعات کسب‌وکار</h1>
          <p>اطلاعات عمومی پروفایل را تغییر بده؛ تغییرات مستقیماً در D1 ذخیره می‌شوند.</p>
        </div>
        <a className="pill-button" href="/dashboard"><ArrowRight size={16} /> بازگشت به داشبورد</a>
      </div>

      {error && <div className="onboarding-error">{error}</div>}
      {message && (
        <div className="onboarding-success">
          <CheckCircle2 size={20} />
          <strong>{message}</strong>
        </div>
      )}

      <section className="dashboard-panel glass-panel profile-editor-card">
        <div className="panel-heading">
          <div><span className="section-kicker">اطلاعات عمومی</span><h2>پروفایل کسب‌وکار</h2></div>
          <Store size={20} />
        </div>

        <div className="form-row two-columns">
          <label>
            <span>نام کسب‌وکار</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            <span>شهر</span>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </label>
        </div>

        <div className="form-row two-columns">
          <label>
            <span>محله / محدوده</span>
            <input value={form.area} onChange={(e) => update("area", e.target.value)} />
          </label>
          <label>
            <span>وب‌سایت</span>
            <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
          </label>
        </div>

        <div className="form-row two-columns">
          <label>
            <span>شماره تماس عمومی</span>
            <input dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="09... یا شماره ثابت" />
          </label>
          <label>
            <span>واتساپ</span>
            <input dir="ltr" inputMode="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="09..." />
          </label>
        </div>

        <label className="form-row">
          <span>آدرس</span>
          <textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </label>

        <label className="form-row">
          <span>اینستاگرام</span>
          <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@username" />
        </label>

        <label className="form-row">
          <span>معرفی کسب‌وکار</span>
          <textarea rows={7} value={form.description} onChange={(e) => update("description", e.target.value)} />
          <small className="field-hint">حداقل ۲۰ کاراکتر؛ اطلاعات واقعی و قابل‌اعتماد بنویسید.</small>
        </label>

        <div className="profile-editor-actions">
          <button className="pill-button dark" type="button" onClick={save} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"} <Save size={16} />
          </button>
        </div>
      </section>

      <BusinessTaxonomyEditor />
      <BusinessHoursEditor />
    </div>
  );
}
