"use client";

import { Calculator, Layers3, RotateCcw, Ruler } from "lucide-react";
import { useMemo, useState } from "react";

type Mode = "box" | "roll";

type BoxValues = {
  roomWidth: string;
  roomLength: string;
  extraArea: string;
  boxCoverage: string;
  wastePercent: string;
};

type RollValues = {
  roomWidth: string;
  roomLength: string;
  rollWidth: string;
  trimAllowance: string;
  wastePercent: string;
  allowRotate: boolean;
};

const boxDefaults: BoxValues = {
  roomWidth: "3.5",
  roomLength: "4.5",
  extraArea: "0",
  boxCoverage: "2.2",
  wastePercent: "8",
};

const rollDefaults: RollValues = {
  roomWidth: "3.5",
  roomLength: "4.5",
  rollWidth: "2",
  trimAllowance: "10",
  wastePercent: "8",
  allowRotate: true,
};

function num(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
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

export default function FlooringEstimator() {
  const [mode, setMode] = useState<Mode>("box");
  const [box, setBox] = useState<BoxValues>(boxDefaults);
  const [roll, setRoll] = useState<RollValues>(rollDefaults);

  const boxResult = useMemo(() => {
    const width = Math.max(0, num(box.roomWidth));
    const length = Math.max(0, num(box.roomLength));
    const extra = Math.max(0, num(box.extraArea));
    const boxCoverage = Math.max(0, num(box.boxCoverage));
    const waste = Math.min(40, Math.max(0, num(box.wastePercent)));

    const roomArea = width * length;
    const baseArea = roomArea + extra;
    const targetArea = baseArea * (1 + waste / 100);
    const boxes = boxCoverage > 0 && targetArea > 0 ? Math.ceil(targetArea / boxCoverage) : 0;
    const purchasedArea = boxes * boxCoverage;
    const surplus = Math.max(0, purchasedArea - baseArea);

    return {
      valid: width > 0 && length > 0 && boxCoverage > 0,
      roomArea,
      baseArea,
      targetArea,
      boxes,
      purchasedArea,
      surplus,
      boxCoverage,
      waste,
    };
  }, [box]);

  const rollResult = useMemo(() => {
    const width = Math.max(0, num(roll.roomWidth));
    const length = Math.max(0, num(roll.roomLength));
    const rollWidth = Math.max(0, num(roll.rollWidth));
    const trimM = Math.max(0, num(roll.trimAllowance)) / 100;
    const waste = Math.min(40, Math.max(0, num(roll.wastePercent)));

    const optionA = {
      orientation: "نوارها در امتداد طول فضا",
      strips: rollWidth > 0 ? Math.ceil(width / rollWidth) : 0,
      cutLength: length + trimM,
    };
    const optionB = {
      orientation: "نوارها در امتداد عرض فضا",
      strips: rollWidth > 0 ? Math.ceil(length / rollWidth) : 0,
      cutLength: width + trimM,
    };

    const withLinear = (option: typeof optionA) => {
      const baseLinear = option.strips * option.cutLength;
      const linear = Math.ceil(baseLinear * (1 + waste / 100) * 10) / 10;
      return {
        ...option,
        baseLinear,
        linear,
        purchasedArea: linear * rollWidth,
      };
    };

    const a = withLinear(optionA);
    const b = withLinear(optionB);
    const best = roll.allowRotate && b.linear < a.linear ? b : a;

    return {
      valid: width > 0 && length > 0 && rollWidth > 0,
      roomArea: width * length,
      best,
      alternative: best.orientation === a.orientation ? b : a,
      waste,
      rollWidth,
    };
  }, [roll]);

  const setBoxValue = (key: keyof BoxValues, value: string) =>
    setBox((current) => ({ ...current, [key]: value }));

  const setRollValue = (key: keyof RollValues, value: string | boolean) =>
    setRoll((current) => ({ ...current, [key]: value }));

  return (
    <section className="carpet-estimator-shell" aria-labelledby="flooring-estimator-title">
      <div className="carpet-estimator-card glass-panel">
        <div className="carpet-estimator-head">
          <div>
            <span className="section-kicker">ابزار خونه‌نما</span>
            <h2 id="flooring-estimator-title">برآورد پارکت، لمینت و کفپوش PVC</h2>
            <p>
              برای پارکت و لمینت تعداد بسته را از روی پوشش هر بسته حساب کنید؛ برای کفپوش رولی، عرض رول و جهت برش را هم در نظر بگیرید.
            </p>
          </div>
          <span className="carpet-estimator-icon"><Calculator size={25} /></span>
        </div>

        <div className="carpet-mode-tabs" role="tablist" aria-label="نوع کفپوش">
          <button type="button" className={mode === "box" ? "is-active" : ""} onClick={() => setMode("box")}>
            <Layers3 size={16} /> پارکت / لمینت بسته‌ای
          </button>
          <button type="button" className={mode === "roll" ? "is-active" : ""} onClick={() => setMode("roll")}>
            <Ruler size={16} /> کفپوش PVC رولی
          </button>
        </div>

        {mode === "box" ? (
          <div className="carpet-estimator-grid">
            <label>
              <span>عرض فضا</span>
              <div><input inputMode="decimal" value={box.roomWidth} onChange={(e) => setBoxValue("roomWidth", e.target.value)} /><b>متر</b></div>
            </label>
            <label>
              <span>طول فضا</span>
              <div><input inputMode="decimal" value={box.roomLength} onChange={(e) => setBoxValue("roomLength", e.target.value)} /><b>متر</b></div>
            </label>
            <label>
              <span>مساحت اضافه (اختیاری)</span>
              <div><input inputMode="decimal" value={box.extraArea} onChange={(e) => setBoxValue("extraArea", e.target.value)} /><b>مترمربع</b></div>
              <small>برای راهرو، ورودی یا بخش دیگری که می‌خواهید به همین خرید اضافه شود.</small>
            </label>
            <label>
              <span>پوشش هر بسته</span>
              <div><input inputMode="decimal" value={box.boxCoverage} onChange={(e) => setBoxValue("boxCoverage", e.target.value)} /><b>مترمربع</b></div>
              <small>عدد دقیق روی بسته همان محصول را وارد کنید.</small>
            </label>
            <label>
              <span>پرت پیشنهادی</span>
              <div><input inputMode="decimal" value={box.wastePercent} onChange={(e) => setBoxValue("wastePercent", e.target.value)} /><b>٪</b></div>
              <small>شکل فضا، جهت چیدمان و برش‌ها روی پرت اثر دارند.</small>
            </label>
          </div>
        ) : (
          <>
            <div className="carpet-estimator-grid">
              <label>
                <span>عرض فضا</span>
                <div><input inputMode="decimal" value={roll.roomWidth} onChange={(e) => setRollValue("roomWidth", e.target.value)} /><b>متر</b></div>
              </label>
              <label>
                <span>طول فضا</span>
                <div><input inputMode="decimal" value={roll.roomLength} onChange={(e) => setRollValue("roomLength", e.target.value)} /><b>متر</b></div>
              </label>
              <label>
                <span>عرض رول کفپوش</span>
                <div><input inputMode="decimal" value={roll.rollWidth} onChange={(e) => setRollValue("rollWidth", e.target.value)} /><b>متر</b></div>
              </label>
              <label>
                <span>تلرانس برش هر نوار</span>
                <div><input inputMode="decimal" value={roll.trimAllowance} onChange={(e) => setRollValue("trimAllowance", e.target.value)} /><b>سانتی‌متر</b></div>
              </label>
              <label>
                <span>پرت پیشنهادی</span>
                <div><input inputMode="decimal" value={roll.wastePercent} onChange={(e) => setRollValue("wastePercent", e.target.value)} /><b>٪</b></div>
              </label>
            </div>

            <label className="tool-check carpet-rotate-check">
              <input type="checkbox" checked={roll.allowRotate} onChange={(e) => setRollValue("allowRotate", e.target.checked)} />
              <span>اگر جهت طرح اجازه می‌دهد، چرخاندن جهت برش برای کاهش مصرف بررسی شود</span>
            </label>
          </>
        )}

        <button type="button" className="carpet-reset" onClick={() => {
          setBox(boxDefaults);
          setRoll(rollDefaults);
        }}>
          <RotateCcw size={15} /> بازنشانی
        </button>
      </div>

      <aside className="carpet-estimator-result glass-panel" aria-live="polite">
        <span className="section-kicker">نتیجه برآورد</span>

        {mode === "box" ? (
          !boxResult.valid ? (
            <div className="carpet-result-empty"><strong>ابعاد و پوشش هر بسته را کامل وارد کنید.</strong></div>
          ) : (
            <>
              <div className="carpet-main-result">
                <span>پیشنهاد خرید</span>
                <strong>{fa(boxResult.boxes)} بسته</strong>
                <small>هر بسته {fa(boxResult.boxCoverage, 2)} مترمربع</small>
              </div>
              <dl className="carpet-result-breakdown">
                <div><dt>مساحت اصلی فضا</dt><dd>{fa(boxResult.roomArea, 2)} مترمربع</dd></div>
                <div><dt>مساحت پایه با بخش اضافه</dt><dd>{fa(boxResult.baseArea, 2)} مترمربع</dd></div>
                <div><dt>نیاز با پرت</dt><dd>{fa(boxResult.targetArea, 2)} مترمربع</dd></div>
                <div><dt>مساحت اسمی خرید</dt><dd>{fa(boxResult.purchasedArea, 2)} مترمربع</dd></div>
                <div><dt>مازاد تقریبی پس از خرید بسته کامل</dt><dd>{fa(boxResult.surplus, 2)} مترمربع</dd></div>
                <div><dt>پرت لحاظ‌شده</dt><dd>{fa(boxResult.waste)}٪</dd></div>
              </dl>
            </>
          )
        ) : (
          !rollResult.valid ? (
            <div className="carpet-result-empty"><strong>ابعاد و عرض رول را کامل وارد کنید.</strong></div>
          ) : (
            <>
              <div className="carpet-main-result">
                <span>متراژ طولی پیشنهادی رول</span>
                <strong>{fa(rollResult.best.linear, 1)} متر طول</strong>
                <small>رول با عرض {fa(rollResult.rollWidth, 2)} متر</small>
              </div>
              <dl className="carpet-result-breakdown">
                <div><dt>مساحت فضا</dt><dd>{fa(rollResult.roomArea, 2)} مترمربع</dd></div>
                <div><dt>جهت پیشنهادی برش</dt><dd>{rollResult.best.orientation}</dd></div>
                <div><dt>تعداد نوار کامل</dt><dd>{fa(rollResult.best.strips)}</dd></div>
                <div><dt>طول هر نوار</dt><dd>{fa(rollResult.best.cutLength, 2)} متر</dd></div>
                <div><dt>مساحت اسمی خرید</dt><dd>{fa(rollResult.best.purchasedArea, 2)} مترمربع</dd></div>
                <div><dt>پرت لحاظ‌شده</dt><dd>{fa(rollResult.waste)}٪</dd></div>
              </dl>
              {roll.allowRotate && rollResult.alternative.linear !== rollResult.best.linear && (
                <p className="carpet-alt-note">
                  جهت جایگزین حدود {fa(rollResult.alternative.linear, 1)} متر طول مصرف می‌کند. اگر طرح یا شرایط نصب جهت مشخصی دارد، کیفیت اجرا از کمترین مصرف مهم‌تر است.
                </p>
              )}
            </>
          )
        )}

        <p className="carpet-result-disclaimer">
          این ابزار برای برآورد اولیه خرید است. شکل نامنظم فضا، شکست‌ها، ستون، جهت چیدمان، زیرسازی، الگوی نصب، اختلاف بچ یا سری تولید و توصیه سازنده می‌توانند مقدار نهایی را تغییر دهند.
        </p>
      </aside>
    </section>
  );
}
