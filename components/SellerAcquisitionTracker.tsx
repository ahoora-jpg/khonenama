"use client";
import { useEffect } from "react";
import type { SellerAcquisitionEvent } from "@/lib/seller-acquisition-events";

// Anonymous aggregate events only. No referrer, URL query, identity or form content.
export default function SellerAcquisitionTracker({ page }: { page: "landing" | "guide" }) {
  useEffect(() => {
    if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    const sent = new Set<string>();
    function record(event: SellerAcquisitionEvent) {
      const key = `khonenama-seller:${page}:${event}`;
      if (sent.has(key)) return;
      try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* memory-only fallback */ }
      sent.add(key);
      fetch("/api/seller-acquisition", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }), keepalive: true }).catch(() => {});
    }
    record(page === "landing" ? "seller_landing_view" : "seller_guide_view");
    const click = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor) return;
      const target = new URL(anchor.getAttribute("href") || "", location.href);
      if (target.origin === location.origin && target.pathname === "/register-business") record("seller_registration_click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [page]);
  return null;
}
