"use client";

import { useState } from "react";

type BusinessGalleryImageProps = {
  thumbnailUrl?: string;
  fullUrl: string;
  alt: string;
};

export default function BusinessGalleryImage({ thumbnailUrl, fullUrl, alt }: BusinessGalleryImageProps) {
  const [open, setOpen] = useState(false);
  const previewUrl = thumbnailUrl || fullUrl;

  return <>
    <button type="button" className="business-gallery-preview" onClick={() => setOpen(true)} aria-label={"نمایش بزرگ: " + alt}>
      <img src={previewUrl} alt={alt} width={800} height={600} loading="lazy" decoding="async" />
    </button>
    {open && <div className="business-gallery-lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
      <button type="button" className="business-gallery-close" aria-label="بستن تصویر" onClick={() => setOpen(false)}>×</button>
      <img src={fullUrl} alt={alt} width={2560} height={1920} decoding="async" onClick={(event) => event.stopPropagation()} />
    </div>}
  </>;
}
