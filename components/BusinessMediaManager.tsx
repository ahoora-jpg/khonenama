"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BusinessPhotoHeader from "@/components/BusinessPhotoHeader";
import BusinessAlbumManager from "@/components/BusinessAlbumManager";
import { VIDEO_LIMITS } from "@/lib/business-video";
import { prepareBusinessImage } from "@/lib/prepare-business-image";
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
  kind: "image" | "logo" | "cover" | "video";
  alt_text?: string | null;
  sort_order: number;
  file_url?: string | null;
  thumbnail_url?: string | null;
};

const limits: Record<string, number> = {
  free: 10,
  pro: 30,
  premium: 70,
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
  const [uploadKind, setUploadKind] = useState<"image" | "cover" | "logo" | "video">("image");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const limit = limits[plan] || limits.free;
  const remaining = Math.max(0, limit - media.filter(item => item.kind === "image").length);

  const videoLimit = VIDEO_LIMITS[plan] || 0;
  const videoRemaining = Math.max(0, videoLimit - media.filter(item => item.kind === "video").length);
  const available = uploadKind === "video" ? videoRemaining : uploadKind === "image" ? remaining : 1;
  const cover = media.find(item => item.kind === "cover");
  const logo = media.find(item => item.kind === "logo");
  const [businessName, setBusinessName] = useState("غرفه شما");
  const [businessDetails, setBusinessDetails] = useState({description:"",location:"",services:[] as string[]});
  const [localPreview, setLocalPreview] = useState<{kind:string;url:string}|null>(null);
  const previewUrl = useRef<string|null>(null);
  useEffect(()=>()=>{if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);},[]);
  const [mediaRevision, setMediaRevision] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const number = (value: number) => value.toLocaleString("fa-IR");
  function pick(kind: "image" | "cover" | "logo" | "video") { setUploadKind(kind); setPickerOpen(true); requestAnimationFrame(()=>document.getElementById("media-source-picker")?.scrollIntoView({behavior:"smooth",block:"nearest"})); }
  const sortedMedia = useMemo(
    () => media.filter(item => item.kind === "image" || item.kind === "video").sort((a, b) => (a.kind === "cover" ? -1 : b.kind === "cover" ? 1 : a.sort_order - b.sort_order)),
    [media]
  );

  async function load() {
    try {
      const response = await fetch("/api/me/business/media", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");
      setMedia(Array.isArray(result.media) ? result.media : []);
      setConfigured(Boolean(result.configured));
      setMediaRevision(value => value + 1);
    } catch {
      setMessage("دریافت تصاویر انجام نشد. دوباره وارد پنل شوید.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetch("/api/me/business", {cache:"no-store"}).then(r=>r.json()).then(data=>{if(data.business?.name){setBusinessName(data.business.name);setBusinessDetails({description:data.business.description || "",location:[data.business.city,data.business.area].filter(Boolean).join("، "),services:(data.business.services || []).map((item:any)=>item.name)});}}).catch(()=>{});
  }, []);

  async function uploadOne(file: File) {
    if (uploadKind === "video") {
      if (file.type !== "video/mp4" || file.size > 15 * 1024 * 1024) throw new Error("ویدیو باید MP4 و حداکثر ۱۵ مگابایت باشد.");
    } else if (!file.type.startsWith("image/")) {
      throw new Error("فقط فایل تصویری مجاز است.");
    }
    if (uploadKind !== "video" && file.size > 8 * 1024 * 1024) {
      throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد.");
    }

    if(uploadKind === "cover" || uploadKind === "logo"){
      if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);
      previewUrl.current=URL.createObjectURL(file);
      setLocalPreview({kind:uploadKind,url:previewUrl.current});
    }
    const form = new FormData();
    form.append("kind", uploadKind);
    form.append("file", uploadKind === "video" ? file : await prepareBusinessImage(file));

    const response = await fetch("/api/me/business/media/upload", {
      method: "POST",
      body: form,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      if (result?.error === "IMAGEKIT_NOT_CONFIGURED" || result?.error === "MEDIA_STORAGE_NOT_CONFIGURED") {
        setConfigured(false);
        throw new Error("فضای تصاویر هنوز به سایت متصل نشده است.");
      }
      if (["VIDEO_TOO_LONG", "INVALID_VIDEO", "VIDEO_PLAN_REQUIRED", "VIDEO_LIMIT_REACHED"].includes(result?.error)) throw new Error(result.error === "VIDEO_TOO_LONG" ? "ویدیو باید حداکثر ۲۰ ثانیه باشد." : result.error === "INVALID_VIDEO" ? "فایل ویدیو معتبر نیست." : "ظرفیت ویدیو یا اشتراک فعال را بررسی کنید.");
      if (result?.error === "GALLERY_LIMIT_REACHED") {
        throw new Error("ظرفیت تصاویر این پلن تکمیل شده است.");
      }
      if (result?.error === "FILE_TOO_LARGE") {
        throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد.");
      }
      if (result?.error === "INVALID_FILE_TYPE") {
        throw new Error("فرمت این تصویر مجاز نیست.");
      }
      if (result?.error === "MEDIA_PROCESSING_FAILED") {
        throw new Error("آماده‌سازی این تصویر انجام نشد. عکس دیگری انتخاب کنید یا دوباره تلاش کنید.");
      }
      throw new Error("آپلود تصویر انجام نشد.");
    }
  }

  async function chooseFiles(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files).slice(0, available);
    if (!selected.length) {
      setMessage("ظرفیت تصاویر این پلن تکمیل شده است.");
      return;
    }

    setPickerOpen(false);
    setUploading(true);
    setMessage("");
    let savedCount = 0;
    try {
      for (let index = 0; index < selected.length; index += 1) {
        setProgress("در حال آماده‌سازی و آپلود " + (uploadKind === "video" ? "ویدیو " : "تصویر ") + (index + 1) + " از " + selected.length);
        await uploadOne(selected[index]);
        savedCount += 1;
        await load();
      }
      setProgress("");
      setMessage(number(selected.length) + (uploadKind === "video" ? " ویدیو با موفقیت ذخیره شد." : " تصویر با موفقیت ذخیره شد.") + (files.length > selected.length ? " تعداد عکس‌های اضافی از ظرفیت پلن بیشتر بود و ارسال نشد." : ""));
      await load();
    } catch (error: any) {
      setProgress("");
      await load();
      setMessage(number(savedCount) + " عکس ذخیره شد؛ " + number(selected.length - savedCount) + " عکس ارسال نشده است. " + (error?.message || "آپلود تصاویر انجام نشد."));
    } finally {
      setUploading(false);
      if(previewUrl.current){URL.revokeObjectURL(previewUrl.current);previewUrl.current=null;}
      setLocalPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
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
          <h2>ظاهر غرفه و نمونه‌کارها</h2>
        </div>
        <Camera size={20} />
      </div>

      <div className="owner-booth-preview business-profile-hero">
        <span className="section-kicker">غرفه شما از نگاه مشتری</span>
        <p>۱. روی پس‌زمینه بزنید و کاور را انتخاب کنید. ۲. روی پروفایل بزنید و عکس آن را بگذارید. ۳. نمونه‌کارها را اضافه کنید. هر عکس را می‌توانید دوباره عوض کنید.</p>
      {pickerOpen && <div id="media-source-picker" className="media-source-picker" role="group" aria-label="انتخاب منبع عکس">
        <strong>{uploadKind === "video" ? "افزودن ویدیو (MP4، تا ۲۰ ثانیه و ۱۵ مگابایت)" : uploadKind === "cover" ? "تصویر پس‌زمینه" : uploadKind === "logo" ? "عکس پروفایل" : "افزودن عکس به آلبوم"}</strong>
        <button className="pill-button dark" type="button" onClick={()=>fileRef.current?.click()}><ImagePlus size={18}/> انتخاب از گالری</button>
        {uploadKind !== "video" && <button className="pill-button" type="button" onClick={()=>cameraRef.current?.click()}><Camera size={18}/> عکس گرفتن</button>}
        <button className="pill-button" type="button" onClick={()=>setPickerOpen(false)}>انصراف</button>
      </div>}
        <BusinessPhotoHeader name={businessName} cover={localPreview?.kind === "cover" ? localPreview.url : cover?.file_url} logo={localPreview?.kind === "logo" ? localPreview.url : logo?.file_url} disabled={uploading || !configured} onEdit={pick} />
        <div className="profile-main-card glass-panel"><div className="profile-title-row"><div><h2>{businessName}</h2><p>{businessDetails.description}</p></div></div><div className="profile-meta-grid"><div><span><strong>موقعیت</strong><small>{businessDetails.location}</small></span></div></div><div className="service-chips">{businessDetails.services.map(service=><span key={service}>{service}</span>)}</div><p>{localPreview ? "پیش‌نمایش عکس انتخابی؛ در حال ذخیره…" : "این نمای کاور و پروفایل شماست؛ برای تغییر، روی خود عکس بزنید."}</p></div>
      </div>
      <p>تصاویر باید متعلق به کسب‌وکار یا با اجازه صاحب اثر باشند. تصویر الهام‌بخش را نمونه‌کار اجراشده معرفی نکنید؛ چهره، نشانی دقیق، شماره تماس و مدارک مشتری را پیش از انتشار حذف یا محو کنید.</p>
      <div className="media-capacity" aria-live="polite">
        <div><strong>{number(media.filter(item => item.kind === "image").length)}</strong><span>عکس ذخیره‌شده</span></div>
        <div><strong>{number(remaining)}</strong><span>جای خالی برای عکس</span></div>
        <div><strong>{number(limit)}</strong><span>ظرفیت عکس‌های پلن</span></div>
      </div>
      <p className="media-capacity-note">کاور و پروفایل جدا از این تعداد هستند. تعداد آلبوم‌ها محدود نیست.</p>
      <p>ویدیو: {number(media.filter(item => item.kind === "video").length)} ذخیره‌شده از {number(videoLimit)}؛ {number(videoRemaining)} جای خالی. MP4، حداکثر ۲۰ ثانیه و ۱۵ مگابایت.</p>
      {videoLimit > 0 && <button type="button" className="pill-button" disabled={uploading || !videoRemaining || !configured} onClick={() => pick("video")}>+ افزودن ویدیو</button>}
      <input ref={fileRef} type="file" accept={uploadKind === "video" ? "video/mp4" : "image/*"} multiple={uploadKind === "image" || uploadKind === "video"} hidden onChange={event => chooseFiles(event.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={event => chooseFiles(event.target.files)} />

      <div className="panel-heading"><h3>عکس‌ها و ویدیوهای نمونه‌کار</h3><button className="pill-button dark" type="button" disabled={uploading || !configured || !remaining} onClick={()=>pick("image")}><ImagePlus size={18}/> افزودن عکس</button></div>
      {!configured && (
        <div className="business-media-config-note">
          اتصال فضای تصاویر موقتاً در دسترس نیست. دوباره وارد پنل شوید یا با پشتیبانی تماس بگیرید.
        </div>
      )}

      {progress && <div className="business-media-message" role="status">{progress}</div>}
      {message && <div className="business-media-message">{message}</div>}

      {sortedMedia.length ? (
        <div className="business-media-grid">
          <button className="media-add-tile" type="button" disabled={uploading || !configured || !remaining} onClick={()=>pick("image")}><ImagePlus size={32}/><strong>افزودن عکس</strong><span>{number(remaining)} جای خالی</span></button>
          {sortedMedia.map((item) => (
            <article className={"business-media-item " + (item.kind === "cover" ? "is-cover" : "")} key={item.id}>
              {item.file_url ? (
                item.kind === "video" ? <video src={item.file_url} controls playsInline preload="metadata" style={{width:"100%"}} /> : <img src={item.thumbnail_url || item.file_url} alt={item.alt_text || ""} loading="lazy" />
              ) : (
                <div className="business-media-missing"><ImagePlus size={22} /></div>
              )}

              {item.kind === "cover" && (
                <span className="business-media-cover-badge"><Crown size={12} /> تصویر اصلی</span>
              )}

              <div className="business-media-actions">
                {item.kind === "image" && (
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
                  title="نام و شرح عکس"
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
                    placeholder="نام و شرح کوتاه عکس"
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
          <button className="pill-button dark" type="button" disabled={uploading || !configured} onClick={()=>pick("image")}><ImagePlus size={18}/> افزودن اولین عکس</button>
        </div>
      )}
      <BusinessAlbumManager mediaRevision={mediaRevision} onAddPhotos={()=>pick("image")} />
    </section>
  );
}
