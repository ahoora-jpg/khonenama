"use client";
import { modelCode } from "@/lib/model-quote";
import { useEffect, useRef, useState } from "react";

export default function BusinessAlbumManager({ mediaRevision = 0, onAddPhotos }: { mediaRevision?: number; onAddPhotos?: () => void }) {
  const [albums, setAlbums] = useState<{ id: number; title: string; description: string; media: {id:number;url:string;kind?:string}[]; project: {service:string;materials:string;area:string}|null }[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [locked,setLocked] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<number | null>(null);
  const [media, setMedia] = useState<{ id: number; file_url: string; alt_text: string; kind: string }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState({service:'',materials:'',area:''});
  const [selected, setSelected] = useState<number[]>([]);
  const [mediaSearch,setMediaSearch]=useState("");
  const addingToAlbum=useRef(false);
  const knownMedia=useRef<Set<number>>(new Set());
  const filteredMedia=media.filter(item=>(item.alt_text||"").includes(mediaSearch.trim()));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    const [a, m] = await Promise.all([fetch("/api/me/business/albums", { cache: "no-store" }), fetch("/api/me/business/media", { cache: "no-store" })]);
    if (!a.ok || !m.ok) throw new Error("LOAD_FAILED");
    const data = await a.json(); const images = await m.json();
    const nextMedia=images.media.filter((item: any) => item.file_url && (item.kind === "image" || item.kind === "video"));
    if(addingToAlbum.current){const added=nextMedia.filter((item:any)=>!knownMedia.current.has(item.id)).map((item:any)=>item.id);if(added.length){setSelected(previous=>Array.from(new Set([...previous,...added])));}}
    knownMedia.current=new Set(nextMedia.map((item:any)=>item.id));
    setAlbums(data.albums); setMedia(nextMedia);setLocked(data.limit===0);
  }
  useEffect(() => { load().catch(() => setMessage("دریافت دسته‌ها انجام نشد؛ صفحه را دوباره باز کنید.")); }, [mediaRevision]);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/me/business/albums", { method: editingAlbum ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id:editingAlbum, title, description, mediaIds: selected, project }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error === "PAID_PLAN_REQUIRED" ? "ساخت دسته به اشتراک فعال نیاز دارد." : "دسته ثبت نشد؛ ظرفیت و عکس‌های انتخابی را بررسی کنید."); return; }
      setEditorOpen(false); addingToAlbum.current=false; setTitle(""); setDescription(""); setSelected([]); setEditingAlbum(null); setProject({service:'',materials:'',area:''}); await load(); setMessage("دسته ذخیره شد؛ نمایش عمومی آن تابع وضعیت انتشار غرفه است.");
    } catch { setMessage("ارتباط برقرار نشد؛ دوباره تلاش کنید."); } finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (!window.confirm("دسته حذف شود؟ عکس‌های گالری باقی می‌مانند.")) return false;
    setBusy(true);
    try {
      const response = await fetch("/api/me/business/albums", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error("DELETE_FAILED"); await load(); return true;
    } catch { setMessage("حذف انجام نشد؛ دوباره تلاش کنید."); return false; } finally { setBusy(false); }
  }
  return <section className="dashboard-panel glass-panel">
    <h2>دسته‌بندی نمونه‌کارها</h2>
    {locked&&<p>دسته‌بندی نمونه‌کارها با پلن حرفه‌ای یا ویژه فعال است. دسته‌های قبلی حفظ می‌شوند و گالری سادهٔ غرفه در دسترس می‌ماند.</p>}
    {!editorOpen && <div className="owner-album-tiles">
      {albums.map(album => <button className="owner-album-tile" type="button" key={album.id} disabled={busy} onClick={()=>{addingToAlbum.current=false;setEditingAlbum(album.id);setEditorOpen(true);setTitle(album.title);setDescription(album.description);setSelected(album.media.map(photo=>photo.id));setProject(album.project||{service:'',materials:'',area:''});setMediaSearch("");setMessage("");}}>
        {album.media[0] && (album.media[0].kind === "video" ? <span>▶</span> : <img src={album.media[0].url} alt="" loading="lazy" />)}
        <strong>{album.title}</strong><span>{album.media.length.toLocaleString("fa-IR")} عکس / ویدیو · ویرایش</span>
      </button>)}
      <button className="owner-album-tile owner-album-create" type="button" disabled={busy||locked} onClick={()=>{setEditorOpen(true);setEditingAlbum(null);setTitle("دسته " + (albums.length+1).toLocaleString("fa-IR"));setDescription("");setSelected([]);setProject({service:'',materials:'',area:''});setMediaSearch("");setMessage("");}}><strong>＋ ایجاد دسته</strong></button>
    </div>}
    {editorOpen && <form onSubmit={create}>
      <p>{albums.length.toLocaleString("fa-IR")} دسته ساخته‌اید؛ تعداد دسته‌ها محدود نیست.</p>
      <label>نام دسته<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <details><summary>توضیحات بیشتر (اختیاری)</summary>
      <label>شرح پروژه<textarea maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></label>
      {(['service','materials','area'] as const).map(key=><label key={key}>{{service:'خدمت انجام‌شده',materials:'متریال استفاده‌شده',area:'شهر یا محدوده؛ بدون آدرس خصوصی'}[key]}<input maxLength={300} value={project[key]} onChange={e=>setProject({...project,[key]:e.target.value})}/></label>)}
      </details>
      <p>عکس‌های این دسته را انتخاب کنید؛ یک یا چند عکس به دلخواه شما.</p>
      <p role="status">{media.length.toLocaleString("fa-IR")} عکس / ویدیو موجود · {selected.length.toLocaleString("fa-IR")} انتخاب‌شده برای این دسته</p>
      <label>جست‌وجو در عنوان عکس‌ها<input type="search" value={mediaSearch} onChange={e=>setMediaSearch(e.target.value)}/></label>
      <button type="button" className="pill-button" disabled={busy||!filteredMedia.length} onClick={()=>setSelected(previous=>Array.from(new Set([...previous,...filteredMedia.map(item=>item.id)])))}>انتخاب همه نتایج</button>
      <button type="button" className="pill-button" disabled={busy||!selected.length} onClick={()=>setSelected([])}>پاک‌کردن انتخاب‌ها</button>
      {!filteredMedia.length&&<p>عکسی با این عنوان پیدا نشد.</p>}
      {onAddPhotos && <button type="button" className="pill-button" disabled={busy} onClick={()=>{addingToAlbum.current=true;onAddPhotos();}}>+ افزودن عکس جدید به این دسته</button>}
      <button type="button" className="pill-button" onClick={() => load().catch(() => setMessage("دریافت عکس‌ها انجام نشد."))}>به‌روزرسانی عکس‌ها</button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>{filteredMedia.map(item => <label key={item.id}><input type="checkbox" disabled={busy} aria-label={item.alt_text||`انتخاب ${item.kind==='video'?'ویدیو':'عکس'} ${item.id}`} checked={selected.includes(item.id)} onChange={e => setSelected(previous=>e.target.checked ? Array.from(new Set([...previous, item.id])) : previous.filter(id => id !== item.id))} />{item.kind === "video" ? <video src={item.file_url} width={80} height={80} preload="metadata" muted playsInline /> : <img src={item.file_url} alt={item.alt_text || "انتخاب عکس نمونه‌کار"} width={80} height={80} loading="lazy" style={{ objectFit: "cover" }} />}{item.kind === "image" && <span dir="ltr">{modelCode(item.id)}</span>}</label>)}</div>
      <button type="submit" className="pill-button dark" disabled={busy || locked || !selected.length}>{busy ? "در حال ذخیره…" : editingAlbum ? "ذخیره تغییرات دسته" : "+ ساخت دسته"}</button>
      <button type="button" className="pill-button" disabled={busy} onClick={()=>{addingToAlbum.current=false;setEditorOpen(false);setEditingAlbum(null);setMessage("");}}>بستن / انصراف</button>
      {editingAlbum && <button type="button" className="pill-button" disabled={busy} onClick={()=>void remove(editingAlbum).then(ok=>{if(ok){setEditorOpen(false);setEditingAlbum(null);}})}>حذف دسته</button>}
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
