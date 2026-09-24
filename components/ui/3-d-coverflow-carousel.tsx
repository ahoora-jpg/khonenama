"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

const ChevronLeftIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export interface CarouselItem {
  tag?: string;
  titleLine1: string;
  titleLine2?: string;
  desc?: string;
  img: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CoverFlowCarouselProps {
  items?: CarouselItem[];
  sectionLabel?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  className?: string;
  compact?: boolean;
  onCtaClick?: (item: CarouselItem) => void;
}

export const defaultKhonenamaItems: CarouselItem[] = [
  {
    tag: "پرده و پارچه",
    titleLine1: "پرده‌های مدرن",
    titleLine2: "برای خانه‌های امروزی",
    desc: "نمونه‌های منتخب پرده، دوخت و اجرای حرفه‌ای",
    img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    ctaText: "مشاهده دسته",
    ctaUrl: "/category/curtain",
  },
  {
    tag: "طراحی داخلی",
    titleLine1: "فضای گرم و مینیمال",
    titleLine2: "ایده برای هر گوشه خانه",
    desc: "معماران و طراحان داخلی منتخب را پیدا کن",
    img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    ctaText: "طراحان داخلی",
    ctaUrl: "/category/interior-design",
  },
  {
    tag: "کفپوش و پارکت",
    titleLine1: "چوب، بافت و گرما",
    titleLine2: "از انتخاب تا اجرا",
    desc: "پارکت، لمینت و مجریان نزدیک تو",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85",
    ctaText: "مشاهده کفپوش",
    ctaUrl: "/category/flooring",
  },
  {
    tag: "فروشگاه‌ها",
    titleLine1: "ویترین‌های واقعی",
    titleLine2: "نزدیک محل زندگی تو",
    desc: "کسب‌وکارهای دکوراسیون را یکجا مقایسه کن",
    img: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
    ctaText: "جستجوی فروشگاه",
    ctaUrl: "/search",
  },
  {
    tag: "الهام خونه‌نما",
    titleLine1: "خانه‌ای که دوستش داری",
    titleLine2: "از ایده تا اجرا",
    desc: "ترکیب رنگ، نور، بافت و انتخاب‌های بهتر",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    ctaText: "شروع جستجو",
    ctaUrl: "/search",
  },
];

export function CoverFlowCarousel({
  items = defaultKhonenamaItems,
  sectionLabel = "الهام خونه‌نما",
  autoplay = true,
  autoplayDelay = 4500,
  className = "",
  compact = false,
  onCtaClick,
}: CoverFlowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const total = items.length;

  const nextSlide = useCallback(() => setCurrentIndex((prev) => (prev + 1) % total), [total]);
  const prevSlide = useCallback(() => setCurrentIndex((prev) => (prev - 1 + total) % total), [total]);
  const goToSlide = (idx: number) => setCurrentIndex(idx % total);

  useEffect(() => {
    if (!autoplay || isHovered || total <= 1) return;
    const interval = setInterval(nextSlide, autoplayDelay);
    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, isHovered, nextSlide, total]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 45) diff < 0 ? nextSlide() : prevSlide();
  };

  if (!items?.length) return null;

  const cardWidth = compact ? 250 : 330;
  const cardHeight = compact ? 410 : 500;
  const nearOffset = compact ? 190 : 285;
  const farOffset = compact ? 335 : 510;
  const stageHeight = compact ? 450 : 520;

  return (
    <section
      className={`coverflow-root ${compact ? "coverflow-compact" : ""} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="coverflow-bg" aria-hidden="true">
        <img
          src={items[currentIndex]?.img}
          alt={`پس‌زمینه تصویری ${items[currentIndex]?.titleLine1 || "الهام دکوراسیون"}`}
          onError={(event) => { event.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"; }}
        />
        <div />
      </div>

      <div className="coverflow-inner">
        {sectionLabel && (
          <div className="coverflow-label">
            <span />
            <strong>{sectionLabel}</strong>
            <span />
          </div>
        )}

        <div className="coverflow-stage" style={{ height: stageHeight, perspective: "1400px" }}>
          {items.map((item, idx) => {
            const offset = (idx - currentIndex + total) % total;
            let transform = "translateX(0px) scale(.4) rotateY(0deg)";
            let opacity = 0;
            let zIndex = 0;
            let filter = "brightness(.4) blur(2px)";
            let isCenter = false;

            if (offset === 0) {
              isCenter = true;
              transform = "translateX(0) scale(1) rotateY(0deg)";
              opacity = 1; zIndex = 30; filter = "brightness(1)";
            } else if (offset === 1) {
              transform = `translateX(${nearOffset}px) scale(.84) rotateY(-24deg)`;
              opacity = .68; zIndex = 20; filter = "brightness(.72)";
            } else if (offset === 2) {
              transform = `translateX(${farOffset}px) scale(.68) rotateY(-38deg)`;
              opacity = .34; zIndex = 10; filter = "brightness(.52) blur(1px)";
            } else if (offset === total - 1) {
              transform = `translateX(-${nearOffset}px) scale(.84) rotateY(24deg)`;
              opacity = .68; zIndex = 20; filter = "brightness(.72)";
            } else if (offset === total - 2) {
              transform = `translateX(-${farOffset}px) scale(.68) rotateY(38deg)`;
              opacity = .34; zIndex = 10; filter = "brightness(.52) blur(1px)";
            }

            return (
              <div
                key={idx}
                className="coverflow-card"
                onClick={() => !isCenter && goToSlide(idx)}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  transform,
                  opacity,
                  zIndex,
                  filter,
                  cursor: isCenter ? "default" : "pointer",
                  boxShadow: isCenter
                    ? "0 28px 70px rgba(0,0,0,.45),0 0 36px rgba(197,168,128,.22)"
                    : "0 16px 36px rgba(0,0,0,.28)",
                }}
              >
                <img src={item.img} alt={item.titleLine1} onError={(event) => { event.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"; }} />
                <div className="coverflow-vignette" />
                <div className="coverflow-content" style={{ opacity: isCenter ? 1 : 0, pointerEvents: isCenter ? "auto" : "none" }}>
                  <span className="coverflow-tag">{item.tag}</span>
                  <div className="coverflow-copy">
                    <h2>{item.titleLine1}</h2>
                    {item.titleLine2 && <strong>{item.titleLine2}</strong>}
                    <i />
                    {item.desc && <p>{item.desc}</p>}
                    <a
                      href={item.ctaUrl || "#"}
                      onClick={(e) => {
                        if (onCtaClick) {
                          e.preventDefault();
                          onCtaClick(item);
                        }
                      }}
                    >
                      <span>{item.ctaText || "مشاهده"}</span>
                      <ArrowRightIcon />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="coverflow-nav coverflow-prev" onClick={prevSlide} aria-label="اسلاید قبلی"><ChevronLeftIcon /></button>
        <button className="coverflow-nav coverflow-next" onClick={nextSlide} aria-label="اسلاید بعدی"><ChevronRightIcon /></button>

        <div className="coverflow-dots">
          {items.map((_, idx) => (
            <button key={idx} onClick={() => goToSlide(idx)} aria-label={`اسلاید ${idx + 1}`} className={idx === currentIndex ? "active" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

export const Component = CoverFlowCarousel;
export default CoverFlowCarousel;
