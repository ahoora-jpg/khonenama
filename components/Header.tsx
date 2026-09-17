"use client";

import { Menu, Search, Store, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["دسته‌بندی‌ها", "#categories"],
  ["فروشگاه‌ها", "#featured"],
  ["طراحان", "#designers"],
  ["راهنمای خرید", "#guides"],
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header-wrap">
      <div className="site-header shell glass-panel">
        <a className="brand" href="#top" aria-label="خونه‌نما">
          خونه<span>نما</span>
        </a>

        <nav className="desktop-nav" aria-label="منوی اصلی">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button className="icon-button desktop-search" aria-label="جستجو">
            <Search size={19} />
          </button>
          <a className="pill-button dark desktop-cta" href="#join">
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
        <div className="mobile-nav shell glass-panel">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a className="pill-button dark" href="#join" onClick={() => setOpen(false)}>
            ثبت کسب‌وکار
          </a>
        </div>
      )}
    </header>
  );
}
