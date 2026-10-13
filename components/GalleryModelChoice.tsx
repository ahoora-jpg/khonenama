"use client";
import { modelCode } from "@/lib/model-quote";

export default function GalleryModelChoice({ businessSlug, mediaId }: { businessSlug: string; mediaId: number }) {
  return <div className="gallery-model-choice"><span dir="ltr">{modelCode(mediaId)}</span><button type="button" className="pill-button" onClick={()=>{
    window.dispatchEvent(new CustomEvent("khonenama-model-selected", {detail:{businessSlug,mediaId}}));
    document.getElementById("quote")?.scrollIntoView({behavior:"smooth",block:"start"});
  }}>این مدل را می‌خواهم · درخواست قیمت</button></div>;
}
