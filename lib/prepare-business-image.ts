const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 2560;
const MAX_PIXELS = 48_000_000;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

/** Re-encode locally to reduce upload traffic; server processing remains mandatory. */
export async function prepareBusinessImage(file: File): Promise<File> {
  if (!TYPES.has(file.type)) throw new Error("فرمت این تصویر مجاز نیست. عکس را با فرمت JPG، PNG یا WebP انتخاب کنید.");
  if (!file.size || file.size > MAX_INPUT_BYTES) throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد.");
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("این تصویر قابل خواندن نیست. عکس دیگری انتخاب کنید."));
      image.src = url;
    });
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height || width * height > MAX_PIXELS) throw new Error("ابعاد تصویر بیش از حد بزرگ است. نسخه کوچک‌تری انتخاب کنید.");
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    try {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("آماده‌سازی تصویر انجام نشد. مرورگر را به‌روز کنید.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const encode = (quality: number) => new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("آماده‌سازی تصویر انجام نشد.")), "image/webp", quality);
      });
      let blob = await encode(0.92);
      if (blob.size > 1024 * 1024) blob = await encode(0.86);
      if (blob.size > MAX_INPUT_BYTES) throw new Error("تصویر آماده‌شده بیش از حد حجیم است. عکس دیگری انتخاب کنید.");
      const extension = blob.type === "image/webp" ? "webp" : "png";
      return new File([blob], (file.name.replace(/\.[^.]+$/, "") || "business-image") + "." + extension, { type: blob.type });
    } finally {
      canvas.width = canvas.height = 1;
    }
  } finally {
    image.src = "";
    URL.revokeObjectURL(url);
  }
}
