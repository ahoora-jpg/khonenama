"use client";

import { useEffect, useState } from "react";
import { decorSurfaces, validateDecorPhoto, type DecorSurface, type DecorDesignGenerator } from "@/lib/decor-design-contract";

const names: Record<DecorSurface, string> = { curtain: "پرده", wallpaper: "کاغذ دیواری", flooring: "کفپوش", carpet: "موکت" };

function PhotoInput({ title, onChange }: { title: string; onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <label className="decor-photo-input"><strong>{title}</strong>
    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
      const file = event.target.files?.[0] ?? null;
      const message = file ? validateDecorPhoto(file) : null;
      setError(message ?? "");
      setPreview(file && !message ? URL.createObjectURL(file) : "");
      onChange(message ? null : file);
    }} />
    {preview && <img src={preview} alt={title} style={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain" }} />}
    {error && <span role="alert">{error}</span>}
  </label>;
}

/** Prepared only. Intentionally not imported into the public site until provider/cost approval. */
export default function DecorDesignPreview({ generate }: { generate?: DecorDesignGenerator }) {
  const [room, setRoom] = useState<File | null>(null);
  const [material, setMaterial] = useState<File | null>(null);
  const [surface, setSurface] = useState<DecorSurface>("curtain");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  return <section aria-labelledby="decor-preview-title" className="shell decor-preview-section">
    <h2 id="decor-preview-title">انتخابت را در خانه خودت ببین</h2>
    <p>عکس فضای خودت و طرح محصول را انتخاب کن. نتیجه تولیدشده نمایی فرضی است؛ رنگ، اندازه و اجرای نهایی باید با فروشنده بررسی شود.</p>
    <form onSubmit={async event => {
      event.preventDefault();
      if (!room || !material || !generate || pending) return;
      setPending(true); setError(""); setResult("");
      try { const output = await generate({ room, material, surface, details }); setResult(output.imageUrl); }
      catch { setError("ساخت پیش‌نمایش انجام نشد. دوباره تلاش کنید."); }
      finally { setPending(false); }
    }}>
      <PhotoInput title="عکس اتاق یا پنجره" onChange={file => { setRoom(file); setResult(""); }} />
      <PhotoInput title="عکس طرح یا محصول دلخواه" onChange={file => { setMaterial(file); setResult(""); }} />
      <label>محصول<select value={surface} onChange={event => setSurface(event.target.value as DecorSurface)}>{decorSurfaces.map(value => <option key={value} value={value}>{names[value]}</option>)}</select></label>
      <label>رنگ، مدل و توضیح دلخواه<textarea maxLength={500} value={details} onChange={event => setDetails(event.target.value)} /></label>
      <p>عکس‌ها تا زمانی که «ساخت پیش‌نمایش» را نزنید از گوشی شما ارسال نمی‌شوند.</p>
      <button type="submit" disabled={!generate || !room || !material || pending}>{pending ? "در حال ساخت…" : "ساخت پیش‌نمایش"}</button>
      {!generate && <p role="status">نسخه آماده‌سازی؛ سرویس تولید تصویر هنوز فعال نشده است.</p>}
      {error && <p role="alert">{error}</p>}
      {result && <figure><img src={result} alt="پیش‌نمایش فرضی دکوراسیون تولیدشده با هوش مصنوعی" /><figcaption>طرح فرضی با هوش مصنوعی</figcaption></figure>}
    </form>
  </section>;
}
