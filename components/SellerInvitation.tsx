"use client";
import { ArrowUpLeft, Store } from "lucide-react";

type Props = { category?: string; categoryLabel?: string; city?: string; source: string; empty?: boolean };

// A quiet, truthful invitation placed after buyer-first content.
export default function SellerInvitation({ category = "", categoryLabel = "", city = "", source, empty = false }: Props) {
  const query = new URLSearchParams({ source });
  if (category) query.set("category", category);
  if (city) query.set("city", city);
  const subject = [categoryLabel, city].filter(Boolean).join(" در ");
  return <aside className="category-empty glass-panel seller-invitation" aria-label="معرفی ثبت غرفه برای صاحبان کسب‌وکار">
    <Store size={22} aria-hidden="true" />
    <div>
      <strong>{subject ? `صاحب کسب‌وکار ${subject} هستید؟` : "صاحب کسب‌وکار دکوراسیون هستید؟"}</strong>
      <p>{empty ? "هنوز غرفهٔ واقعیِ کافی در این بخش نداریم. اگر در این حوزه فعالیت می‌کنید، اطلاعات واقعی کسب‌وکارتان را معرفی کنید." : "می‌توانید کسب‌وکارتان، خدمات و محدودهٔ واقعی فعالیتتان را در خونه‌نما معرفی کنید."}</p>
    </div>
    <a className="pill-button dark" href={`/register-business?${query.toString()}`} onClick={() => {
      if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
      fetch("/api/seller-acquisition", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "seller_registration_click", source }), keepalive: true }).catch(() => undefined);
    }}>معرفی کسب‌وکار <ArrowUpLeft size={16} /></a>
  </aside>;
}
