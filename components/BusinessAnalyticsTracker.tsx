"use client";

import { useEffect } from "react";

async function send(slug: string, event: string) {
  try {
    await fetch("/api/business/" + encodeURIComponent(slug) + "/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    });
  } catch {}
}

export default function BusinessAnalyticsTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = "khonenama-view-" + slug;
    const last = Number(sessionStorage.getItem(key) || "0");
    const now = Date.now();
    if (!last || now - last > 30 * 60 * 1000) {
      sessionStorage.setItem(key, String(now));
      void send(slug, "view");
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const element = target?.closest?.("[data-analytics-event]") as HTMLElement | null;
      const name = element?.dataset.analyticsEvent;
      if (name) void send(slug, name);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [slug]);

  return null;
}
