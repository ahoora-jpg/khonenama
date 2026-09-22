"use client";

import { Calculator, RotateCcw, Scissors, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Values = {
  trackWidth: string;
  finishedDrop: string;
  fabricWidth: string;
  fullness: string;
  panelCount: string;
  headingAllowance: string;
  hemAllowance: string;
  trimAllowance: string;
  patternRepeat: string;
  addPatternPlacement: boolean;
  halfDrop: boolean;
};

const defaults: Values = {
  trackWidth: "250",
  finishedDrop: "280",
  fabricWidth: "140",
  fullness: "2",
  panelCount: "2",
  headingAllowance: "10",
  hemAllowance: "20",
  trimAllowance: "5",
  patternRepeat: "0",
  addPatternPlacement: true,
  halfDrop: false,
};

function parseNumber(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace("٫", ".")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fa(value: number, digits = 0) {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export default function CurtainFabricCalculator() {
  const [values, setValues] = useState<Values>(defaults);

  const result = useMemo(() => {
    const track = Math.max(0, parseNumber(values.trackWidth));
    const drop = Math.max(0, parseNumber(values.finishedDrop));
    const fabricWidth = Math.max(0, parseNumber(values.fabricWidth));
    const fullness = Math.min(4, Math.max(1, parseNumber(values.fullness)));
    const panels = Math.max(1, Math.min(4, Math.round(parseNumber(values.panelCount) || 1)));
    const heading = Math.max(0, parseNumber(values.headingAllowance));
    const hem = Math.max(0, parseNumber(values.hemAllowance));
    const trim = Math.max(0, parseNumber(values.trimAllowance));
    const repeat = Math.max(0, parseNumber(values.patternRepeat));

    const requiredFlatWidth = track * fullness;
    const widths = fabricWidth > 0 ? Math.ceil(requiredFlatWidth / fabricWidth) : 0;
    const rawCutDrop = drop + heading + hem + trim;
    const adjustedCutDrop =
      repeat > 0 && rawCutDrop > 0 ? Math.ceil(rawCutDrop / repeat) * repeat : rawCutDrop;
    const placement = repeat > 0 && values.addPatternPlacement ? repeat : 0;
    const fabricCm = widths * adjustedCutDrop + placement;
    const meters = Math.ceil((fabricCm / 100) * 10) / 10;
    const actualFullness = track > 0 ? (widths * fabricWidth) / track : 0;

    return {
      valid: track > 0 && drop > 0 && fabricWidth > 0,
      requiredFlatWidth,
      widths,
      rawCutDrop,
      adjustedCutDrop,
      placement,
      meters,
      actualFullness,
      panels,
      widthPerPanel: panels > 0 ? track / panels : 0,
      fabricWidthsPerPanel: panels > 0 ? widths / panels : 0,
      repeat,
    };
  }, [values]);

  const set = (key: keyof Values, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <section className="curtain-calculator-shell" aria-labelledby="curtain-calculator-title">
      <div className="curtain-calculator-card glass-panel">
        <div className="curtain-calculator-head">
          <div>
            <span className="section-kicker">ابزار خونه‌نما</span>
            <h2 id="curtain-calculator-title">محاسبه متراژ پارچه پرده</h2>
            <p>
              عرض ریل، قد نهایی، Fullness، عرض پارچه، اضافه دوخت و Pattern Repeat را وارد کنید
              تا تعداد عرض پارچه و متراژ تقریبی سفارش محاسبه شود.
            </p>
          </div>
          <span className="curtain-calculator-icon" aria-hidden="true"><Scissors size={25} /></span>
        </div>

        <div className="curtain-preset-row">
          <button type="button" onClick={() => set("fullness", "1.5")}>جمع سبک ۱٫۵×</button>
          <button type="button" onClick={() => set("fullness", "2")}>جمع استاندارد ۲×</button>
          <button type="button" onClick={() => set("fullness", "2.5")}>جمع پُر ۲٫۵×</button>
        </div>

        <div className="curtain-calculator-grid">
          <label>
            <span>عرض ریل یا میله پرده</span>
            <div><input inputMode="decimal" value={values.trackWidth} onChange={(e) => set("trackWidth", e.target.value)} /><b>سانتی‌متر</b></div>
            <small>عرض خود ریل/میله را وارد کنید، نه فقط شیشه پنجره.</small>
          </label>

          <label>
            <span>قد نهایی پرده</span>
            <div><input inputMode="decimal" value={values.finishedDrop} onChange={(e) => set("finishedDrop", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>عرض پارچه</span>
            <div><input inputMode="decimal" value={values.fabricWidth} onChange={(e) => set("fabricWidth", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>Fullness / ضریب جمع</span>
            <div><input inputMode="decimal" value={values.fullness} onChange={(e) => set("fullness", e.target.value)} /><b>×</b></div>
            <small>برای مدل و نوار پرده خاص، ضریب پیشنهادی خیاط یا سازنده اولویت دارد.</small>
          </label>

          <label>
            <span>تعداد پنل پرده</span>
            <div>
              <select value={values.panelCount} onChange={(e) => set("panelCount", e.target.value)}>
                <option value="1">۱ پنل</option>
                <option value="2">۲ پنل</option>
                <option value="3">۳ پنل</option>
                <option value="4">۴ پنل</option>
              </select>
            </div>
          </label>

          <label>
            <span>اضافه بالای پرده</span>
            <div><input inputMode="decimal" value={values.headingAllowance} onChange={(e) => set("headingAllowance", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>اضافه سجاف پایین</span>
            <div><input inputMode="decimal" value={values.hemAllowance} onChange={(e) => set("hemAllowance", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>تلرانس صاف‌کردن برش</span>
            <div><input inputMode="decimal" value={values.trimAllowance} onChange={(e) => set("trimAllowance", e.target.value)} /><b>سانتی‌متر</b></div>
          </label>

          <label>
            <span>تکرار عمودی طرح</span>
            <div><input inputMode="decimal" value={values.patternRepeat} onChange={(e) => set("patternRepeat", e.target.value)} /><b>سانتی‌متر</b></div>
            <small>برای پارچه ساده صفر بگذارید. Repeat را از مشخصات پارچه بخوانید.</small>
          </label>
        </div>

        {parseNumber(values.patternRepeat) > 0 && (
          <div className="curtain-options">
            <label className="tool-check">
              <input type="checkbox" checked={values.addPatternPlacement} onChange={(e) => set("addPatternPlacement", e.target.checked)} />
              <span>یک Pattern Repeat اضافه برای جای‌گذاری طرح در ابتدای برش در نظر بگیر</span>
            </label>
            <label className="tool-check">
              <input type="checkbox" checked={values.halfDrop} onChange={(e) => set("halfDrop", e.target.checked)} />
              <span>پارچه من Half-drop / Offset Match است</span>
            </label>
          </div>
        )}

        <div className="curtain-calculator-actions">
          <button type="button" className="curtain-reset" onClick={() => setValues(defaults)}>
            <RotateCcw size={15} /> بازنشانی
          </button>
        </div>
      </div>

      <aside className="curtain-result-card glass-panel" aria-live="polite">
        <span className="section-kicker">نتیجه محاسبه</span>

        {!result.valid ? (
          <div className="curtain-result-empty">
            <Calculator size={24} />
            <strong>ابعاد را کامل وارد کنید.</strong>
            <p>عرض ریل، قد پرده و عرض پارچه باید بیشتر از صفر باشند.</p>
          </div>
        ) : (
          <>
            <div className="curtain-meter-result">
              <span>متراژ تقریبی پارچه</span>
              <strong>{fa(result.meters, 1)} متر</strong>
              <small>{fa(result.widths)} عرض کامل پارچه</small>
            </div>

            <dl className="curtain-result-breakdown">
              <div><dt>عرض تخت موردنیاز با Fullness</dt><dd>{fa(result.requiredFlatWidth)} سانتی‌متر</dd></div>
              <div><dt>Fullness واقعی بعد از گرد کردن</dt><dd>{fa(result.actualFullness, 2)}×</dd></div>
              <div><dt>طول خام هر برش</dt><dd>{fa(result.rawCutDrop)} سانتی‌متر</dd></div>
              <div><dt>طول هر برش بعد از تنظیم طرح</dt><dd>{fa(result.adjustedCutDrop)} سانتی‌متر</dd></div>
              <div><dt>عرض نهایی هر پنل روی ریل</dt><dd>{fa(result.widthPerPanel, 1)} سانتی‌متر</dd></div>
              <div><dt>سهم عرض پارچه برای هر پنل</dt><dd>{fa(result.fabricWidthsPerPanel, 2)} عرض</dd></div>
              {result.placement > 0 && <div><dt>اضافه جای‌گذاری Pattern</dt><dd>{fa(result.placement)} سانتی‌متر</dd></div>}
            </dl>

            {values.halfDrop && result.repeat > 0 && (
              <div className="curtain-warning-note">
                <Sparkles size={16} />
                <p>
                  این پارچه Half-drop/Offset است. نتیجه بالا برای Repeat استاندارد محاسبه شده و
                  سفارش نهایی باید با الگوی Half-drop همان پارچه دوباره کنترل شود.
                </p>
              </div>
            )}

            <p className="curtain-result-disclaimer">
              این ابزار برای برآورد خرید پارچه است. نوع Heading، دوخت دست‌دوز، پنل‌های نامتقارن،
              عرض قابل‌استفاده پارچه و روش Match می‌توانند متراژ نهایی خیاط را تغییر دهند.
            </p>
          </>
        )}
      </aside>
    </section>
  );
}
