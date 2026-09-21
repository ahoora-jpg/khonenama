"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save, Shapes } from "lucide-react";
import { BUSINESS_CATEGORIES } from "@/lib/business-taxonomy";

export default function BusinessTaxonomyEditor() {
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/business/taxonomy", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled && result?.ok) {
          setCategories(Array.isArray(result.categories) ? result.categories : []);
          setServices(Array.isArray(result.services) ? result.services : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleServices = useMemo(() => {
    const grouped: { slug: string; label: string; services: readonly string[] }[] = [];
    for (const item of BUSINESS_CATEGORIES) {
      if (categories.includes(item.slug)) grouped.push(item);
    }
    return grouped;
  }, [categories]);

  function toggleCategory(slug: string) {
    setMessage("");
    setCategories((current) => {
      const exists = current.includes(slug);
      const next = exists ? current.filter((item) => item !== slug) : [...current, slug];

      if (exists) {
        const removed = BUSINESS_CATEGORIES.find((item) => item.slug === slug);
        if (removed) {
          setServices((currentServices) =>
            currentServices.filter((service) => !removed.services.includes(service))
          );
        }
      }
      return next;
    });
  }

  function toggleService(service: string) {
    setMessage("");
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  async function save() {
    setMessage("");
    if (!categories.length || !services.length) {
      setMessage("حداقل یک دسته و یک خدمت انتخاب کنید.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/me/business/taxonomy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories, services }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        setMessage("ذخیره دسته‌ها و خدمات انجام نشد.");
        return;
      }
      setMessage("دسته‌ها و خدمات ذخیره شدند.");
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-panel glass-panel business-taxonomy-editor">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">معرفی خدمات</span>
          <h2>دسته‌ها و خدمات</h2>
        </div>
        <Shapes size={20} />
      </div>

      {loading ? (
        <div className="profile-editor-loading">
          <Loader2 className="spin" size={18} /> در حال دریافت خدمات...
        </div>
      ) : (
        <>
          <div className="taxonomy-category-grid">
            {BUSINESS_CATEGORIES.map((item) => {
              const active = categories.includes(item.slug);
              return (
                <button
                  type="button"
                  key={item.slug}
                  className={active ? "taxonomy-category is-active" : "taxonomy-category"}
                  onClick={() => toggleCategory(item.slug)}
                >
                  {active && <CheckCircle2 size={14} />}
                  <strong>{item.label}</strong>
                </button>
              );
            })}
          </div>

          {visibleServices.length > 0 && (
            <div className="taxonomy-service-groups">
              {visibleServices.map((group) => (
                <div className="taxonomy-service-group" key={group.slug}>
                  <strong>{group.label}</strong>
                  <div>
                    {group.services.map((service) => {
                      const active = services.includes(service);
                      return (
                        <button
                          type="button"
                          className={active ? "taxonomy-service is-active" : "taxonomy-service"}
                          key={service}
                          onClick={() => toggleService(service)}
                        >
                          {service}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <div className={message.includes("ذخیره شدند") ? "profile-hours-message is-success" : "profile-hours-message"}>
              {message}
            </div>
          )}

          <button className="pill-button dark" type="button" onClick={save} disabled={saving}>
            <Save size={15} /> {saving ? "در حال ذخیره..." : "ذخیره دسته‌ها و خدمات"}
          </button>
        </>
      )}
    </section>
  );
}
