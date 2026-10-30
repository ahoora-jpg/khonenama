"use client";

import { useMemo, useState } from "react";

function toNumber(value: string) {
  const normalized = value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function LightingEstimator() {
  const [length, setLength] = useState("4");
  const [width, setWidth] = useState("3");
  const [targetLux, setTargetLux] = useState("200");

  const result = useMemo(() => {
    const l = Math.max(0, toNumber(length));
    const w = Math.max(0, toNumber(width));
    const lux = Math.max(0, toNumber(targetLux));
    const area = l * w;
    const theoreticalLumens = area * lux;
    return { area, lux, theoreticalLumens };
  }, [length, width, targetLux]);

  return (
    <section className="glass-panel wallpaper-calculator" aria-labelledby="lighting-estimator-title">
      <div className="section-heading compact-heading">
        <div>
          <span className="section-kicker">برآورد اولیه</span>
          <h2 id="lighting-estimator-title">محاسبه لومن نظری از روی مساحت و لوکس هدف</h2>
        </div>
      </div>

      <div className="wallpaper-calculator-grid">
        <label>
          <span>طول فضا (متر)</span>
          <input inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} />
        </label>
        <label>
          <span>عرض فضا (متر)</span>
          <input inputMode="decimal" value={width} onChange={(event) => setWidth(event.target.value)} />
        </label>
        <label>
          <span>لوکس هدف (lx)</span>
          <input inputMode="decimal" value={targetLux} onChange={(event) => setTargetLux(event.target.value)} />
          <small>لوکس هدف را بر اساس نوع فعالیت، راهنمای طراحی یا نظر متخصص انتخاب کنید.</small>
        </label>
      </div>

      <div className="wallpaper-calculator-result" aria-live="polite">
        <div>
          <span>مساحت فضا</span>
          <strong>{result.area.toLocaleString("fa-IR", { maximumFractionDigits: 2 })} مترمربع</strong>
        </div>
        <div>
          <span>لوکس هدف</span>
          <strong>{result.lux.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} lx</strong>
        </div>
        <div>
          <span>لومن نظری روی سطح</span>
          <strong>{result.theoreticalLumens.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} lm</strong>
        </div>
      </div>

      <p className="calculator-note">
        این عدد حاصل رابطه ساده «لوکس × مساحت» است و برای برآورد اولیه به کار می‌رود. لومن واقعی چراغ‌های موردنیاز به
        پخش نور، ارتفاع نصب، بازتاب سطوح، نور روز، افت نور، یکنواختی و خیرگی وابسته است؛ برای طراحی و سیم‌کشی نهایی از متخصص استفاده کنید.
      </p>
    </section>
  );
}
