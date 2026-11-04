"use client";

import { useState } from "react";

type BusinessGalleryImageProps = {
  thumbnailUrl?: string;
  fullUrl: string;
  alt: string;
};

function mediumDisplayUrl(fullUrl: string) {
  try {
    const url = new URL(fullUrl, "https://khonenama.ir");
    const isFirstPartyMedia = ["khonenama.ir", "www.khonenama.ir"].includes(url.hostname)
      && /^\/media\/businesses\/[1-9]\d*\/[a-f0-9-]{36}\.webp$/.test(url.pathname);
    return isFirstPartyMedia ? url.pathname.replace(/\.webp$/, "-medium.webp") + url.search : fullUrl;
  } catch {
    return fullUrl;
  }
}

export default function BusinessGalleryImage({ thumbnailUrl, fullUrl, alt }: BusinessGalleryImageProps) {
  const [open, setOpen] = useState(false);
  const previewUrl = thumbnailUrl || fullUrl;
  const modalUrl = mediumDisplayUrl(fullUrl);

  return <>
    <button type="button" className="business-gallery-preview" onClick={() => setOpen(true)} aria-label={"نمایش بزرگ: " + alt}>
      <img src={previewUrl} alt={alt} width={800} height={600} loading="lazy" decoding="async" />
    </button>
    {open && <div className="business-gallery-lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
      <button type="button" className="business-gallery-close" aria-label="بستن تصویر" onClick={() => setOpen(false)}>×</button>
      <img src={modalUrl} alt={alt} width={1280} height={960} decoding="async" onClick={(event) => event.stopPropagation()} />
    </div>}
  </>;
}
