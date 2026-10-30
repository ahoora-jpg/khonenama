"use client";

import { useEffect } from "react";

type Source = "direct" | "search" | "ai" | "social" | "referral" | "internal";
type EventName = "page_view" | "internal_click" | "tool_interaction" | "contact_intent" | "lead_submit";

const sourceKey = "kn_seo_source";

function sourceFromReferrer(referrer: string): Source {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    if (host === location.hostname.toLowerCase().replace(/^www\./, "")) return "internal";

    const aiHosts = [
      "chatgpt.com", "perplexity.ai", "claude.ai", "gemini.google.com",
      "copilot.microsoft.com", "you.com", "meta.ai",
    ];
    if (aiHosts.some((item) => host === item || host.endsWith("." + item))) return "ai";

    const searchHosts = [
      "google.com", "google.ir", "bing.com", "duckduckgo.com", "yahoo.com",
      "yandex.com", "search.brave.com",
    ];
    if (searchHosts.some((item) => host === item || host.endsWith("." + item))) return "search";

    const socialHosts = [
      "instagram.com", "t.me", "telegram.me", "linkedin.com", "facebook.com",
      "x.com", "twitter.com", "pinterest.com",
    ];
    if (socialHosts.some((item) => host === item || host.endsWith("." + item))) return "social";
    return "referral";
  } catch {
    return "direct";
  }
}

function targetGroup(path: string) {
  if (path.startsWith("/business/")) return "business";
  if (path.startsWith("/tools")) return "tool";
  if (path.startsWith("/karaj")) return "local";
  if (path.startsWith("/category/")) return "category";
  if (path.startsWith("/magazine/")) return "magazine";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/register-business")) return "register";
  if (path.startsWith("/download-app") || path.startsWith("/downloads/")) return "app";
  return "other";
}

function safePath() {
  return location.pathname.slice(0, 180) || "/";
}

function getSource(): Source {
  try {
    const stored = sessionStorage.getItem(sourceKey) as Source | null;
    if (stored && ["direct","search","ai","social","referral","internal"].includes(stored)) return stored;
    const source = sourceFromReferrer(document.referrer);
    sessionStorage.setItem(sourceKey, source);
    return source;
  } catch {
    return sourceFromReferrer(document.referrer);
  }
}

function send(event: EventName, group = "") {
  const path = safePath();
  if (/^\/(admin|sms|api)(\/|$)/.test(path)) return;
  const payload = JSON.stringify({ event, source: getSource(), path, targetGroup: group });
  void fetch("/api/seo/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {});
}

export default function SeoJourneyTracker() {
  useEffect(() => {
    send("page_view");

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href, location.href);
        if (url.protocol === "tel:" || url.protocol === "mailto:" || url.hostname === "wa.me") {
          send("contact_intent", "contact");
          return;
        }
        if (url.origin !== location.origin) return;
        if (url.hash === "#quote") {
          send("contact_intent", "contact");
          return;
        }
        send("internal_click", targetGroup(url.pathname));
      } catch {}
    }

    function onSeoEvent(event: Event) {
      const detail = (event as CustomEvent<{ event?: EventName; targetGroup?: string }>).detail;
      if (!detail?.event) return;
      send(detail.event, detail.targetGroup || "");
    }

    let toolInteracted = false;
    function onInput(event: Event) {
      if (toolInteracted || !location.pathname.startsWith("/tools/")) return;
      const element = event.target as HTMLElement | null;
      if (!element?.matches?.("input, select, textarea")) return;
      toolInteracted = true;
      send("tool_interaction", "tool");
    }

    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("input", onInput, { capture: true });
    window.addEventListener("kn:seo-event", onSeoEvent);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("input", onInput, true);
      window.removeEventListener("kn:seo-event", onSeoEvent);
    };
  }, []);

  return null;
}
