"use client";

import { ChevronDown, Download, Menu, Search, Store, X } from "lucide-react";
import { useEffect, useState } from "react";

const categories = [
  ["پرده و متعلقات", "/category/curtain"],
  ["کفپوش و پارکت", "/category/flooring"],
  ["موکت", "/category/carpet"],
  ["کاغذ دیواری", "/category/wallpaper"],
  ["طراحی داخلی", "/category/interior-design"],
  ["خانه هوشمند", "/category/smart-home"],
] as const;

const links = [
  ["چطور کار می‌کند؟", "/#how-it-works"],
  ["راهنماها", "/magazine"],
  ["ابزارها", "/tools"],
  ["پیگیری درخواست", "/request-status"],
] as const;

const androidDownloadUrl = "/download-app";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 0);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <header className={`site-header-wrap${scrolled && !open ? " is-scrolled" : ""}`}>
      <div className="site-header shell glass-panel premium-header">
        <a className="brand" href="/" aria-label="خونه نما">
          <img src="/khonenama-brand.webp" alt="خونه نما" width={660} height={203} style={{ width: "clamp(136px, 16vw, 200px)", height: "auto", display: "block" }} />
          <span className="brand-tagline">بازار تخصصی پرده و دکوراسیون</span>
        </a>

        <nav className="desktop-nav premium-nav" aria-label="منوی اصلی">
          <div className="nav-mega-wrap">
            <button className="nav-mega-trigger" type="button">
              دسته‌بندی‌ها <ChevronDown size={15} />
            </button>
            <div className="nav-mega">
              <div className="nav-mega-intro">
                <span>انتخاب سریع</span>
                <strong>برای خونه‌ات از اینجا شروع کن</strong>
                <p>محصول، فروشگاه یا متخصص را بر اساس نیازت پیدا کن.</p>
              </div>
              <div className="nav-mega-grid">
                {categories.map(([label, href], index) => (
                  <a href={href} key={href} style={{ ["--i" as string]: index }}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{label}</strong>
                  </a>
                ))}
              </div>
            </div>
          </div>
          {links.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>

        <div className="header-actions">
          <a
            className="app-download-button"
            href={androidDownloadUrl}
            aria-label="دانلود اپلیکیشن اندروید خونه نما"
          >
            <Download size={17} />
            <span>دانلود اپ</span>
          </a>
          <a className="icon-button desktop-search depth-button" href="/search" aria-label="جستجو">
            <Search size={19} />
          </a>
          <a className="desktop-business-login" href="/business/login">ورود کسب‌وکار</a>
          <a className="pill-button dark desktop-cta premium-cta-button" href="/register-business">
            <Store size={17} />
            ثبت کسب‌وکار
          </a>
          <button
            className="icon-button mobile-menu-button"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-nav shell glass-panel premium-mobile-nav">
          <strong>دسته‌بندی‌ها</strong>
          {categories.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a
            className="pill-button app-download-mobile"
            href={androidDownloadUrl}
            onClick={() => setOpen(false)}
          >
            <Download size={17} />
            دانلود اپلیکیشن اندروید
          </a>
          <a href="/for-business" onClick={() => setOpen(false)}>برای کسب‌وکارها</a>
          <a href="/business/login" onClick={() => setOpen(false)}>ورود کسب‌وکار</a>
          <a className="pill-button dark" href="/register-business" onClick={() => setOpen(false)}>
            ثبت کسب‌وکار
          </a>
        </div>
      )}
    </header>
  );
}
