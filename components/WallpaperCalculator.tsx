"use client";

import { Calculator, RotateCcw, Ruler, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Values = {
  totalWidth: string;
  wallHeight: string;
  rollWidth: string;
  rollLength: string;
  patternRepeat: string;
  trimAllowance: string;
  wastePercent: string;
  openingsArea: string;
};

const defaults: Values = {
  totalWidth: "10",
  wallHeight: "2.8",
  rollWidth: "53",
  rollLength: "10.05",
  patternRepeat: "0",
  trimAllowance: "10",
  wastePercent: "10",
  openingsArea: "0",
};

function numberOf(value: string) {
  const normalized = value.replace("٫", ".").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fa(value: number, digits = 0) {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export default function WallpaperCalculator() {
  const [values, setValues] = useState<Values>(defaults);

  const result = useMemo(() => {
    const totalWidthM = Math.max(0, numberOf(values.totalWidth));
    const wallHeightM = Math.max(0, numberOf(values.wallHeight));
    const rollWidthCm = Math.max(0, numberOf(values.rollWidth));
    const rollLengthM = Math.max(0, numberOf(values.rollLength));
    const repeatCm = Math.max(0, numberOf(values.patternRepeat));
    const trimCm = Math.max(0, numberOf(values.trimAllowance));
    const waste = Math.min(50, Math.max(0, numberOf(values.wastePercent)));
    const openingsArea = Math.max(0, numberOf(values.openingsArea));

    const baseCutCm = wallHeightM * 100 + trimCm;
    const adjustedCutCm =
      repeatCm > 0 && baseCutCm > 0
        ? Math.ceil(baseCutCm / repeatCm) * repeatCm
        : baseCutCm;

    const baseStrips =
      totalWidthM > 0 && rollWidthCm > 0
        ? Math.ceil((totalWidthM * 100) / rollWidthCm)
        : 0;

    const stripsWithWaste =
      baseStrips > 0 ? Math.ceil(baseStrips * (1 + waste / 100)) : 0;

    const stripsPerRoll =
      rollLengthM > 0 && adjustedCutCm > 0
        ? Math.floor((rollLengthM * 100) / adjustedCutCm)
        : 0;

    const rolls =
      stripsWithWaste > 0 && stripsPerRoll > 0
        ? Math.ceil(stripsWithWaste / stripsPerRoll)
        : 0;

    const grossArea = totalWidthM * wallHeightM;
    const netArea = Math.max(0, grossArea - openingsArea);
    const purchasedArea =
      rolls > 0 && rollWidthCm > 0 && rollLengthM > 0
        ? rolls * (rollWidthCm / 100) * rollLengthM
        : 0;

    const valid =
      totalWidthM > 0 &&
      wallHeightM > 0 &&
      rollWidthCm > 0 &&
      rollLengthM > 0 &&
      adjustedCutCm > 0;

    return {
      valid,
      rolls,
      baseStrips,
      stripsWithWaste,
      stripsPerRoll,
      adjustedCutCm,
      grossArea,
      netArea,
      purchasedArea,
      repeatCm,
      waste,
    };
  }, [values]);

  const set = (key: keyof Values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const preset = (widthCm: number, lengthM: number) =>
    setValues((current) => ({
      ...current,
      rollWidth: String(widthCm),
      rollLength: String(lengthM),
    }));

  return (
    <section className="wallpaper-calculator-shell" aria-labelledby="wallpaper-calculator-title">
      <div className="wallpaper-calculator-card glass-panel">
        <div className="wallpaper-calculator-head">
          <div>
            <span className="section-kicker">ابزار خونه‌نما</span>
            <h2 id="wallpaper-calculator-title">محاسبه تعداد رول کاغذ دیواری</h2>
            <p>
              محاسبه بر اساس تعداد نوارهای لازم انجام می‌شود؛ بنابراین Pattern Repeat،
              طول برش، پرت و تعداد نوار قابل برداشت از هر رول را هم در نظر می‌گیرد.
            </p>
          </div>
          <span className="wallpaper-calculator-icon" aria-hidden="true">
            <Calculator size={26} />
          </span>
        </div>

        <div className="wallpaper-preset-row" aria-label="ابعاد رایج رول">
          <button type="button" onClick={() => preset(53, 10.05)}>
            رول استاندارد ۵۳ × ۱۰٫۰۵
          </button>
          <button type="button" onClick={() => preset(106, 10.05)}>
            رول عریض ۱۰۶ × ۱۰٫۰۵
          </button>
        </div>

        <div className="wallpaper-calculator-grid">
          <label>
            <span>عرض کل دیوارهای قابل پوشش</span>
            <div><input inputMode="decimal" value={values.totalWidth} onChange={(e) => set("totalWidth", e.target.value)} /><b>متر</b></div>
            <small>عرض همه دیوارها یا قطعاتی را که واقعاً کاغذ می‌خورند با هم جمع کنید.</small>
          </label>

          <label>
            <span>ارتفاع دیوار</span>
            <div><input inputMode="decimal" value={values.wallHeight} onChange={(e) => set("wallHeight", e.target.value)} /><b>متر</b></div>
          </label>

          <label>
            <span>عرض رول</span>
            <div><input inputMode="decimal" value={values.rollWidth} onChange={(e) => set("rollWidth", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>طول رول</span>
            <div><input inputMode="decimal" value={values.rollLength} onChange={(e) => set("rollLength", e.target.value)} /><b>متر</b></div>
          </label>

          <label>
            <span>تکرار طرح (Pattern Repeat)</span>
            <div><input inputMode="decimal" value={values.patternRepeat} onChange={(e) => set("patternRepeat", e.target.value)} /><b>سانتی‌متر</b></div>
            <small>اگر طرح بدون تکرار است، صفر بگذارید. عدد روی لیبل رول را وارد کنید.</small>
          </label>

          <label>
            <span>تلرانس برش بالا و پایین</span>
            <div><input inputMode="decimal" value={values.trimAllowance} onChange={(e) => set("trimAllowance", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>پرت پیشنهادی</span>
            <div><input inputMode="decimal" value={values.wastePercent} onChange={(e) => set("wastePercent", e.target.value)} /><b>٪</b></div>
            <small>برای طرح‌های پیچیده، دیوارهای متعدد یا گوشه‌های زیاد می‌توانید این عدد را بالاتر ببرید.</small>
          </label>

          <label>
            <span>مساحت در و پنجره‌ها (اختیاری)</span>
            <div><input inputMode="decimal" value={values.openingsArea} onChange={(e) => set("openingsArea", e.target.value)} /><b>مترمربع</b></div>
            <small>فقط برای نمایش مساحت خالص است؛ تعداد رول با روش نوار محاسبه می‌شود تا کم‌برآورد نشود.</small>
          </label>
        </div>

        <div className="wallpaper-calculator-actions">
          <button type="button" className="wallpaper-reset" onClick={() => setValues(defaults)}>
            <RotateCcw size={15} /> بازنشانی
          </button>
        </div>
      </div>

      <aside className="wallpaper-result-card glass-panel" aria-live="polite">
        <span className="section-kicker">نتیجه محاسبه</span>

        {!result.valid ? (
          <div className="wallpaper-result-empty">
            <Ruler size={24} />
            <strong>ابعاد را کامل وارد کنید.</strong>
            <p>عرض دیوار، ارتفاع دیوار و ابعاد رول باید بیشتر از صفر باشند.</p>
          </div>
        ) : result.stripsPerRoll < 1 ? (
          <div className="wallpaper-result-empty is-warning">
            <strong>طول رول برای یک نوار کامل کافی نیست.</strong>
            <p>ارتفاع دیوار، تلرانس برش یا طول رول را دوباره بررسی کنید.</p>
          </div>
        ) : (
          <>
            <div className="wallpaper-roll-result">
              <span>پیشنهاد خرید</span>
              <strong>{fa(result.rolls)} رول</strong>
              <small>با {fa(result.waste)}٪ پرت در نظر گرفته‌شده</small>
            </div>

            <dl className="wallpaper-result-breakdown">
              <div><dt>نوار لازم قبل از پرت</dt><dd>{fa(result.baseStrips)}</dd></div>
              <div><dt>نوار لازم با پرت</dt><dd>{fa(result.stripsWithWaste)}</dd></div>
              <div><dt>نوار قابل برش از هر رول</dt><dd>{fa(result.stripsPerRoll)}</dd></div>
              <div><dt>طول هر برش پس از تنظیم طرح</dt><dd>{fa(result.adjustedCutCm, 0)} سانتی‌متر</dd></div>
              <div><dt>مساحت دیوار</dt><dd>{fa(result.grossArea, 2)} مترمربع</dd></div>
              <div><dt>مساحت خالص تقریبی</dt><dd>{fa(result.netArea, 2)} مترمربع</dd></div>
              <div><dt>مساحت اسمی رول‌های خریداری‌شده</dt><dd>{fa(result.purchasedArea, 2)} مترمربع</dd></div>
            </dl>

            {result.repeatCm > 0 && (
              <div className="wallpaper-pattern-note">
                <Sparkles size={16} />
                <p>
                  چون Pattern Repeat برابر {fa(result.repeatCm)} سانتی‌متر است، طول برش هر نوار
                  تا نزدیک‌ترین تکرار کامل طرح گرد شده است.
                </p>
              </div>
            )}

            <p className="wallpaper-result-disclaimer">
              برای سفارش نهایی، شماره Batch/Lot رول‌ها، نوع Match طرح و شرایط واقعی دیوار را
              با فروشنده یا نصاب بررسی کنید. طرح‌های Half-drop یا Offset می‌توانند پرت بیشتری داشته باشند.
            </p>
          </>
        )}
      </aside>
    </section>
  );
}
