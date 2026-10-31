"use client";

import { Download, Menu, Store, X } from "lucide-react";
import { useState } from "react";

const categories = [
  ["نورپردازی داخلی", "/category/lighting"],
  ["پرده و متعلقات", "/category/curtain"],
  ["کفپوش و پارکت", "/category/flooring"],
  ["موکت", "/category/carpet"],
  ["کاغذ دیواری", "/category/wallpaper"],
  ["طراحی داخلی", "/category/interior-design"],
  ["خانه هوشمند", "/category/smart-home"],
] as const;

const links = [
  ["یافتن متخصص", "/search"],
  ["ایده‌ها", "/ideas"],
  ["مجله و راهنماها", "/magazine"],
  ["ابزارها", "/tools"],
] as const;

const androidDownloadUrl = "/download-app";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header-wrap">
      <div className="site-header shell glass-panel premium-header">
        <div className="header-actions">
          <button
            className="site-menu-button"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
            <span>{open ? "بستن" : "منو"}</span>
          </button>
          <a className="pill-button dark desktop-cta premium-cta-button" href="/register-business">
            <Store size={17} />
            ساخت رایگان غرفه
          </a>
        </div>

        <a className="brand" href="/" aria-label="خونه نما">
          <img src="/khonenama-brand.webp" alt="خونه نما" width={660} height={203} style={{ width: "clamp(136px, 16vw, 200px)", height: "auto", display: "block" }} />
          <span className="brand-tagline">بازار تخصصی پرده و دکوراسیون</span>
        </a>
      </div>

      {open && (
        <>
          <button className="site-menu-backdrop" type="button" aria-label="بستن منو" onClick={() => setOpen(false)} />
          <aside className="site-menu-panel premium-mobile-nav" aria-label="منوی اصلی">
            <div className="site-menu-panel-intro">
              <span>خونه‌نما</span>
              <strong>برای خانه‌ات، یک انتخاب مطمئن بساز.</strong>
              <p>متخصص، ایده و راهنمای مورد نیازت را از همین‌جا پیدا کن.</p>
            </div>
            <a className="site-menu-home" href="/" onClick={() => setOpen(false)}>صفحه اصلی</a>
            <a className="site-menu-primary-link" href="/search" onClick={() => setOpen(false)}>یافتن متخصص و غرفه‌ها</a>
            <details className="site-menu-details">
              <summary>دسته‌بندی‌ها</summary>
              <div className="site-menu-details-links">
              {categories.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
              ))}
              </div>
            </details>
            <details className="site-menu-details">
              <summary>ایده و راهنما</summary>
              <div className="site-menu-details-links">
                {links.filter(([label]) => label !== "یافتن متخصص").map(([label, href]) => (
                  <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
                ))}
                <a href="/about" onClick={() => setOpen(false)}>درباره خونه‌نما</a>
                <a href="/request-status" onClick={() => setOpen(false)}>پیگیری درخواست</a>
              </div>
            </details>
            <details className="site-menu-details site-menu-business">
              <summary>برای کسب‌وکارها</summary>
              <div className="site-menu-details-links">
                <a href="/for-business" onClick={() => setOpen(false)}>راهنمای حضور در خونه‌نما</a>
                <a href="/business/login" onClick={() => setOpen(false)}>ورود کسب‌وکار</a>
                <a className="pill-button dark" href="/register-business" onClick={() => setOpen(false)}>ساخت رایگان غرفه</a>
              </div>
            </details>
            <a className="site-menu-download" href={androidDownloadUrl} onClick={() => setOpen(false)}>
              <Download size={17} />
              دانلود اپلیکیشن اندروید
            </a>
          </aside>
        </>
      )}
    </header>
  );
}
