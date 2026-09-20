"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, Pencil, Save, X } from "lucide-react";

export default function BusinessPublicLinkCard({
  slug,
  status,
  onSlugChange,
}: {
  slug?: string;
  status?: string;
  onSlugChange?: (slug: string) => void;
}) {
  const [currentSlug, setCurrentSlug] = useState(slug || "");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSlug, setDraftSlug] = useState(slug || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (slug && slug !== currentSlug) {
      setCurrentSlug(slug);
      setDraftSlug(slug);
    }
  }, [slug, currentSlug]);

  const publicUrl = useMemo(() => {
    if (!currentSlug) return "";
    if (typeof window !== "undefined") {
      return window.location.origin + "/business/" + currentSlug;
    }
    return "https://khonenama.ir/business/" + currentSlug;
  }, [currentSlug]);

  async function copyLink() {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = publicUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function saveSlug() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/me/business/public-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draftSlug }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        const messages: Record<string, string> = {
          SLUG_TOO_SHORT: "آدرس انتخابی خیلی کوتاه است.",
          SLUG_RESERVED: "این آدرس رزرو شده و قابل انتخاب نیست.",
          SLUG_INVALID: "فقط حروف انگلیسی، عدد و خط تیره مجاز است.",
          SLUG_TAKEN: "این آدرس قبلاً استفاده شده است؛ یک گزینه دیگر انتخاب کنید.",
          UNAUTHENTICATED: "برای تغییر لینک دوباره وارد پنل شوید.",
        };
        setMessage(messages[result?.error] || "تغییر لینک انجام نشد.");
        return;
      }

      setCurrentSlug(result.slug);
      setDraftSlug(result.slug);
      setEditing(false);
      setMessage("لینک اختصاصی به‌روزرسانی شد. لینک قبلی هم به این آدرس هدایت می‌شود.");
      onSlugChange?.(result.slug);
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentSlug) return null;

  const isPublished = status === "published";

  return (
    <section className="dashboard-panel glass-panel business-public-link-card">
      <div className="business-public-link-copy">
        <span className="section-kicker">لینک اختصاصی کسب‌وکار</span>
        <h2><Link2 size={20} /> آدرس ثابت پروفایل شما</h2>
        <p>
          این لینک مخصوص همین کسب‌وکار است و می‌توانید آن را در Google Business،
          شبکه‌های اجتماعی، آگهی‌ها، سایت شخصی و هر جای دیگری قرار دهید.
        </p>
      </div>

      <div className="business-public-link-box">
        {editing ? (
          <>
            <div className="business-slug-editor">
              <span dir="ltr">khonenama.ir/business/</span>
              <input
                dir="ltr"
                value={draftSlug}
                onChange={(e) => setDraftSlug(e.target.value.toLowerCase())}
                placeholder="your-business-name"
                autoComplete="off"
              />
            </div>
            <button className="pill-button dark" type="button" onClick={saveSlug} disabled={saving}>
              <Save size={15} /> {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button
              className="pill-button"
              type="button"
              onClick={() => {
                setDraftSlug(currentSlug);
                setEditing(false);
                setMessage("");
              }}
            >
              <X size={15} /> انصراف
            </button>
          </>
        ) : (
          <>
            <code dir="ltr">{publicUrl}</code>
            <button className="pill-button dark" type="button" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "کپی شد" : "کپی لینک"}
            </button>
            <button
              className="pill-button"
              type="button"
              onClick={() => {
                setDraftSlug(currentSlug);
                setEditing(true);
                setMessage("");
              }}
            >
              <Pencil size={15} /> ویرایش آدرس
            </button>
          </>
        )}

        {!editing && isPublished && (
          <a className="pill-button" href={"/business/" + currentSlug} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> مشاهده صفحه
          </a>
        )}

        {!editing && !isPublished && (
          <small>
            لینک ثابت است؛ نمایش عمومی آن بعد از تأیید و انتشار پروفایل فعال می‌شود.
          </small>
        )}

        {message && <small className="business-public-link-message">{message}</small>}
      </div>
    </section>
  );
}
