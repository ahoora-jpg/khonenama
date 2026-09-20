"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";

export default function BusinessPublicLinkCard({
  slug,
  status,
}: {
  slug?: string;
  status?: string;
}) {
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    if (!slug) return "";
    if (typeof window !== "undefined") {
      return window.location.origin + "/business/" + slug;
    }
    return "https://khonenama.ir/business/" + slug;
  }, [slug]);

  async function copyLink() {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = publicUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!slug) return null;

  const isPublished = status === "published";

  return (
    <section className="dashboard-panel glass-panel business-public-link-card">
      <div className="business-public-link-copy">
        <span className="section-kicker">لینک اختصاصی کسب‌وکار</span>
        <h2><Link2 size={20} /> آدرس ثابت پروفایل شما</h2>
        <p>
          این لینک مخصوص همین کسب‌وکار است و می‌توانید آن را در Google Business،
          شبکه‌های اجتماعی، آگهی‌ها، سایت شخصی و هر جای دیگری قرار دهید.
        </p>
      </div>

      <div className="business-public-link-box">
        <code dir="ltr">{publicUrl}</code>
        <button className="pill-button dark" type="button" onClick={copyLink}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "کپی شد" : "کپی لینک"}
        </button>
        {isPublished ? (
          <a className="pill-button" href={"/business/" + slug} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> مشاهده صفحه
          </a>
        ) : (
          <small>
            لینک ثابت است؛ نمایش عمومی آن بعد از تأیید و انتشار پروفایل فعال می‌شود.
          </small>
        )}
      </div>
    </section>
  );
}
