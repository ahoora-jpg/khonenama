"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Crown,
  ImagePlus,
  Loader2,
  Pencil,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type MediaItem = {
  id: number;
  kind: "image" | "logo" | "cover";
  alt_text?: string | null;
  sort_order: number;
  file_url?: string | null;
  thumbnail_url?: string | null;
};

const limits: Record<string, number> = {
  free: 6,
  pro: 20,
  premium: 40,
};

export default function BusinessMediaManager({ plan = "free" }: { plan?: string }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const limit = limits[plan] || limits.free;
  const remaining = Math.max(0, limit - media.length);

  const sortedMedia = useMemo(
    () => [...media].sort((a, b) => (a.kind === "cover" ? -1 : b.kind === "cover" ? 1 : a.sort_order - b.sort_order)),
    [media]
  );

  async function load() {
    try {
      const response = await fetch("/api/me/business/media", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");
      setMedia(Array.isArray(result.media) ? result.media : []);
      setConfigured(Boolean(result.configured));
    } catch {
      setMessage("دریافت تصاویر انجام نشد. دوباره وارد پنل شوید.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadOne(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("فقط فایل تصویری مجاز است.");
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد.");
    }

    const form = new FormData();
    form.append("file", file);

    const response = await fetch("/api/me/business/media/upload", {
      method: "POST",
      body: form,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      if (result?.error === "IMAGEKIT_NOT_CONFIGURED") {
        setConfigured(false);
        throw new Error("فضای تصاویر هنوز به سایت متصل نشده است.");
      }
      if (result?.error === "GALLERY_LIMIT_REACHED") {
        throw new Error("ظرفیت تصاویر این پلن تکمیل شده است.");
      }
      if (result?.error === "FILE_TOO_LARGE") {
        throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد.");
      }
      if (result?.error === "INVALID_FILE_TYPE") {
        throw new Error("فرمت این تصویر مجاز نیست.");
      }
      throw new Error("آپلود تصویر انجام نشد.");
    }
  }

  async function chooseFiles(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files).slice(0, remaining);
    if (!selected.length) {
      setMessage("ظرفیت تصاویر این پلن تکمیل شده است.");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      for (let index = 0; index < selected.length; index += 1) {
        setProgress("در حال آپلود تصویر " + (index + 1) + " از " + selected.length);
        await uploadOne(selected[index]);
      }
      setProgress("");
      setMessage("تصاویر با موفقیت به گالری اضافه شدند.");
      await load();
    } catch (error: any) {
      setProgress("");
      setMessage(error?.message || "آپلود تصاویر انجام نشد.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function patch(id: number, action: string, extra: Record<string, unknown> = {}) {
    setMessage("");
    const response = await fetch("/api/me/business/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      setMessage("ذخیره تغییرات تصویر انجام نشد.");
      return;
    }
    await load();
  }

  async function remove(item: MediaItem) {
    if (!window.confirm("این تصویر از گالری حذف شود؟")) return;
    setMessage("");
    const response = await fetch("/api/me/business/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      setMessage("حذف تصویر انجام نشد.");
      return;
    }
    setMessage("تصویر حذف شد.");
    await load();
  }

  if (loading) {
    return (
      <section className="dashboard-panel glass-panel business-media-manager" id="media">
        <Loader2 className="spin" size={22} />
        <span>در حال دریافت گالری...</span>
      </section>
    );
  }

  return (
    <section className="dashboard-panel glass-panel business-media-manager" id="media">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">نمونه‌کار</span>
          <h2>گالری کسب‌وکار</h2>
        </div>
        <Camera size={20} />
      </div>

      <div className="business-media-toolbar">
        <div>
          <strong>{media.length} از {limit} تصویر</strong>
          <small>
            {plan === "premium"
              ? "پلن ویژه؛ ظرفیت گالری گسترده"
              : plan === "pro"
                ? "پلن حرفه‌ای؛ ظرفیت بیشتر گالری"
                : "پلن پایه؛ تا ۶ تصویر"}
          </small>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => chooseFiles(event.target.files)}
        />
        <button
          className="pill-button dark"
          type="button"
          disabled={uploading || !configured || remaining === 0}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="spin" size={15} /> : <Upload size={15} />}
          {uploading ? "در حال آپلود..." : "افزودن تصویر"}
        </button>
      </div>

      {!configured && (
        <div className="business-media-config-note">
          اتصال فضای تصاویر موقتاً در دسترس نیست. دوباره وارد پنل شوید یا با پشتیبانی تماس بگیرید.
        </div>
      )}

      {progress && <div className="business-media-message">{progress}</div>}
      {message && <div className="business-media-message">{message}</div>}

      {sortedMedia.length ? (
        <div className="business-media-grid">
          {sortedMedia.map((item) => (
            <article className={"business-media-item " + (item.kind === "cover" ? "is-cover" : "")} key={item.id}>
              {item.file_url ? (
                <img src={item.thumbnail_url || item.file_url} alt={item.alt_text || ""} loading="lazy" />
              ) : (
                <div className="business-media-missing"><ImagePlus size={22} /></div>
              )}

              {item.kind === "cover" && (
                <span className="business-media-cover-badge"><Crown size={12} /> تصویر اصلی</span>
              )}

              <div className="business-media-actions">
                {item.kind !== "cover" && (
                  <button type="button" title="انتخاب به‌عنوان تصویر اصلی" onClick={() => patch(item.id, "cover")}>
                    <Star size={14} />
                  </button>
                )}
                <button type="button" title="بالا بردن" onClick={() => patch(item.id, "move-up")}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" title="پایین بردن" onClick={() => patch(item.id, "move-down")}>
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  title="ویرایش توضیح تصویر"
                  onClick={() => {
                    setEditingId(item.id);
                    setAltDraft(item.alt_text || "");
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button className="is-danger" type="button" title="حذف تصویر" onClick={() => remove(item)}>
                  <Trash2 size={14} />
                </button>
              </div>

              {editingId === item.id && (
                <div className="business-media-alt-editor">
                  <input
                    value={altDraft}
                    onChange={(event) => setAltDraft(event.target.value)}
                    placeholder="توضیح کوتاه تصویر برای دسترس‌پذیری و سئو"
                    maxLength={300}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await patch(item.id, "alt", { altText: altDraft });
                      setEditingId(null);
                    }}
                  >
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-upload business-media-empty">
          <ImagePlus size={25} />
          <strong>هنوز تصویری ثبت نشده است</strong>
          <small>اولین تصویر به‌صورت خودکار تصویر اصلی پروفایل می‌شود.</small>
        </div>
      )}
    </section>
  );
}
