"use client";
import { useEffect, useState } from "react";

export default function BusinessAlbumManager({ mediaRevision = 0, onAddPhotos }: { mediaRevision?: number; onAddPhotos?: () => void }) {
  const [albums, setAlbums] = useState<{ id: number; title: string; description: string; media: {id:number;url:string}[]; project: {service:string;materials:string;area:string}|null }[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<number | null>(null);
  const [media, setMedia] = useState<{ id: number; file_url: string; alt_text: string }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState({service:'',materials:'',area:''});
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    const [a, m] = await Promise.all([fetch("/api/me/business/albums", { cache: "no-store" }), fetch("/api/me/business/media", { cache: "no-store" })]);
    if (!a.ok || !m.ok) throw new Error("LOAD_FAILED");
    const data = await a.json(); const images = await m.json();
    setAlbums(data.albums); setMedia(images.media.filter((item: any) => item.file_url && item.kind === "image"));
  }
  useEffect(() => { load().catch(() => setMessage("دریافت آلبوم‌ها انجام نشد؛ صفحه را دوباره باز کنید.")); }, [mediaRevision]);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/me/business/albums", { method: editingAlbum ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id:editingAlbum, title, description, mediaIds: selected, project }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error === "PAID_PLAN_REQUIRED" ? "ساخت آلبوم به اشتراک فعال نیاز دارد." : "آلبوم ثبت نشد؛ ظرفیت و عکس‌های انتخابی را بررسی کنید."); return; }
      setTitle(""); setDescription(""); setSelected([]); setEditingAlbum(null); setProject({service:'',materials:'',area:''}); await load(); setMessage("آلبوم ذخیره شد؛ نمایش عمومی آن تابع وضعیت انتشار غرفه است.");
    } catch { setMessage("ارتباط برقرار نشد؛ دوباره تلاش کنید."); } finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (!window.confirm("آلبوم حذف شود؟ عکس‌های گالری باقی می‌مانند.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/me/business/albums", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error("DELETE_FAILED"); await load();
    } catch { setMessage("حذف انجام نشد؛ دوباره تلاش کنید."); } finally { setBusy(false); }
  }
  return <section className="dashboard-panel glass-panel">
    <h2>آلبوم‌های نمونه‌کار</h2>
    <p>عکس‌های گالری را بر اساس پروژه یا نوع خدمت دسته‌بندی کنید و برای هر آلبوم توضیح کامل بنویسید. مشتری با کیوآرکد وارد گالری شما می‌شود و آلبوم دلخواه را باز می‌کند.</p>
    <p>هر تعداد آلبوم که می‌خواهید بسازید؛ ظرفیت مجموع عکس‌ها به پلن شما بستگی دارد.</p>
    {albums.map(album => <article className="owner-album-card" key={album.id}><h3>{album.title} · {album.media.length.toLocaleString("fa-IR")} عکس</h3><p>{album.description}</p><div className="owner-album-images">{album.media.map(photo=><img key={photo.id} src={photo.url} alt={album.title} loading="lazy" />)}</div><button type="button" className="pill-button" disabled={busy} onClick={()=>{setEditingAlbum(album.id);setTitle(album.title);setDescription(album.description);setSelected(album.media.map(photo=>photo.id));setProject(album.project||{service:'',materials:'',area:''});}}>+ افزودن عکس / ویرایش آلبوم</button><button type="button" className="pill-button" disabled={busy} onClick={() => remove(album.id)}>حذف آلبوم</button></article>)}
    {<form onSubmit={create}>
      <p>{albums.length.toLocaleString("fa-IR")} آلبوم ساخته‌اید؛ تعداد آلبوم‌ها محدود نیست.</p>
      <label>نام آلبوم<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>شرح پروژه<textarea maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></label>
      {(['service','materials','area'] as const).map(key=><label key={key}>{{service:'خدمت انجام‌شده',materials:'متریال استفاده‌شده',area:'شهر یا محدوده؛ بدون آدرس خصوصی'}[key]}<input maxLength={300} value={project[key]} onChange={e=>setProject({...project,[key]:e.target.value})}/></label>)}
      <p>برای تصاویر قبل و بعد، عنوان هر عکس را در بخش گالری با «قبل از اجرا» یا «بعد از اجرا» مشخص کنید. تصاویر باید متعلق به شما یا با اجازه صاحب اثر باشند. عکس مشتری را فقط با اجازه او منتشر کنید. تصویر الهام‌بخش را نمونه‌کار اجراشده معرفی نکنید؛ چهره، نشانی دقیق، شماره و مدارک مشتری را پیش از انتشار حذف یا محو کنید.</p>
      <p>عکس‌های این آلبوم را انتخاب کنید؛ یک یا چند عکس به دلخواه شما.</p>
      {onAddPhotos && <button type="button" className="pill-button" onClick={onAddPhotos}>+ افزودن عکس جدید</button>}
      <button type="button" className="pill-button" onClick={() => load().catch(() => setMessage("دریافت عکس‌ها انجام نشد."))}>به‌روزرسانی عکس‌ها</button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>{media.map(item => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={e => setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))} /><img src={item.file_url} alt={item.alt_text || "انتخاب عکس نمونه‌کار"} width={80} height={80} loading="lazy" style={{ objectFit: "cover" }} /></label>)}</div>
      <button type="submit" className="pill-button dark" disabled={busy || !selected.length}>{busy ? "در حال ذخیره…" : editingAlbum ? "ذخیره تغییرات آلبوم" : "+ ساخت آلبوم"}</button>
      {editingAlbum && <button type="button" className="pill-button" onClick={()=>{setEditingAlbum(null);setTitle("");setDescription("");setSelected([]);setProject({service:'',materials:'',area:''});}}>انصراف از ویرایش</button>}
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
