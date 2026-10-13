export function modelCode(id: number) { return `M-${id}`; }

export function measurement(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim().replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[٫,]/g, ".");
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return amount > 0 && amount <= 100 ? amount : null;
}

export function modelRequestText(model: { id: number; altText?: string }, width: number, height: number | null, note: string) {
  return [`مدل انتخابی: ${modelCode(model.id)}${model.altText ? " — " + model.altText.slice(0, 300) : ""}`, `عرض: ${width} متر`, height !== null ? `ارتفاع: ${height} متر` : "", note.trim().slice(0, 800)].filter(Boolean).join("\n");
}
