"use client";

import { Calculator, Grid3X3, RotateCcw, Ruler } from "lucide-react";
import { useMemo, useState } from "react";

type Mode = "roll" | "tile";

type RollValues = {
  roomWidth: string;
  roomLength: string;
  rollWidth: string;
  trimAllowance: string;
  wastePercent: string;
  allowRotate: boolean;
};

type TileValues = {
  roomWidth: string;
  roomLength: string;
  tileWidth: string;
  tileLength: string;
  tilesPerBox: string;
  wastePercent: string;
};

const rollDefaults: RollValues = {
  roomWidth: "3.5",
  roomLength: "4.5",
  rollWidth: "4",
  trimAllowance: "10",
  wastePercent: "7",
  allowRotate: true,
};

const tileDefaults: TileValues = {
  roomWidth: "3.5",
  roomLength: "4.5",
  tileWidth: "50",
  tileLength: "50",
  tilesPerBox: "20",
  wastePercent: "7",
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

export default function CarpetEstimator() {
  const [mode, setMode] = useState<Mode>("roll");
  const [roll, setRoll] = useState<RollValues>(rollDefaults);
  const [tile, setTile] = useState<TileValues>(tileDefaults);

  const rollResult = useMemo(() => {
    const width = Math.max(0, num(roll.roomWidth));
    const length = Math.max(0, num(roll.roomLength));
    const rollWidth = Math.max(0, num(roll.rollWidth));
    const trimM = Math.max(0, num(roll.trimAllowance)) / 100;
    const waste = Math.min(40, Math.max(0, num(roll.wastePercent)));

    const optionA = {
      orientation: "نوارها در امتداد طول اتاق",
      strips: rollWidth > 0 ? Math.ceil(width / rollWidth) : 0,
      cutLength: length + trimM,
    };
    const optionB = {
      orientation: "نوارها در امتداد عرض اتاق",
      strips: rollWidth > 0 ? Math.ceil(length / rollWidth) : 0,
      cutLength: width + trimM,
    };

    const withLinear = (option: typeof optionA) => {
      const baseLinear = option.strips * option.cutLength;
      const linear = Math.ceil((baseLinear * (1 + waste / 100)) * 10) / 10;
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

  const tileResult = useMemo(() => {
    const width = Math.max(0, num(tile.roomWidth));
    const length = Math.max(0, num(tile.roomLength));
    const tileWidthM = Math.max(0, num(tile.tileWidth)) / 100;
    const tileLengthM = Math.max(0, num(tile.tileLength)) / 100;
    const perBox = Math.max(1, Math.floor(num(tile.tilesPerBox) || 1));
    const waste = Math.min(40, Math.max(0, num(tile.wastePercent)));

    const roomArea = width * length;
    const tileArea = tileWidthM * tileLengthM;
    const rawTiles = tileArea > 0 ? Math.ceil(roomArea / tileArea) : 0;
    const tilesWithWaste = rawTiles > 0 ? Math.ceil(rawTiles * (1 + waste / 100)) : 0;
    const boxes = tilesWithWaste > 0 ? Math.ceil(tilesWithWaste / perBox) : 0;
    const purchasedTiles = boxes * perBox;
    const purchasedArea = purchasedTiles * tileArea;

    return {
      valid: width > 0 && length > 0 && tileArea > 0,
      roomArea,
      tileArea,
      rawTiles,
      tilesWithWaste,
      boxes,
      purchasedTiles,
      purchasedArea,
      perBox,
      waste,
    };
  }, [tile]);

  const setRollValue = (key: keyof RollValues, value: string | boolean) =>
    setRoll((current) => ({ ...current, [key]: value }));

  const setTileValue = (key: keyof TileValues, value: string) =>
    setTile((current) => ({ ...current, [key]: value }));

  return (
    <section className="carpet-estimator-shell" aria-labelledby="carpet-estimator-title">
      <div className="carpet-estimator-card glass-panel">
        <div className="carpet-estimator-head">
          <div>
            <span className="section-kicker">ابزار خونه‌نما</span>
            <h2 id="carpet-estimator-title">برآورد موکت رول و تایلی</h2>
            <p>ابعاد فضا و مشخصات موکت را وارد کنید تا مقدار خرید، پرت و تعداد نوار یا بسته مشخص شود.</p>
          </div>
          <span className="carpet-estimator-icon"><Calculator size={25} /></span>
        </div>

        <div className="carpet-mode-tabs" role="tablist" aria-label="نوع موکت">
          <button type="button" className={mode === "roll" ? "is-active" : ""} onClick={() => setMode("roll")}>
            <Ruler size={16} /> موکت رول
          </button>
          <button type="button" className={mode === "tile" ? "is-active" : ""} onClick={() => setMode("tile")}>
            <Grid3X3 size={16} /> موکت تایلی
          </button>
        </div>

        {mode === "roll" ? (
          <>
            <div className="carpet-estimator-grid">
              <label>
                <span>عرض اتاق</span>
                <div><input inputMode="decimal" value={roll.roomWidth} onChange={(e) => setRollValue("roomWidth", e.target.value)} /><b>متر</b></div>
              </label>
              <label>
                <span>طول اتاق</span>
                <div><input inputMode="decimal" value={roll.roomLength} onChange={(e) => setRollValue("roomLength", e.target.value)} /><b>متر</b></div>
              </label>
              <label>
                <span>عرض رول موکت</span>
                <div><input inputMode="decimal" value={roll.rollWidth} onChange={(e) => setRollValue("rollWidth", e.target.value)} /><b>متر</b></div>
                <small>عرض واقعی رول همان محصول را وارد کنید؛ عرض‌های بازار یکسان نیستند.</small>
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
              <span>اگر جهت خواب/طرح اجازه می‌دهد، چرخاندن جهت برش برای کاهش مصرف بررسی شود</span>
            </label>
          </>
        ) : (
          <div className="carpet-estimator-grid">
            <label>
              <span>عرض اتاق</span>
              <div><input inputMode="decimal" value={tile.roomWidth} onChange={(e) => setTileValue("roomWidth", e.target.value)} /><b>متر</b></div>
            </label>
            <label>
              <span>طول اتاق</span>
              <div><input inputMode="decimal" value={tile.roomLength} onChange={(e) => setTileValue("roomLength", e.target.value)} /><b>متر</b></div>
            </label>
            <label>
              <span>عرض هر تایل</span>
              <div><input inputMode="decimal" value={tile.tileWidth} onChange={(e) => setTileValue("tileWidth", e.target.value)} /><b>سانتی‌متر</b></div>
            </label>
            <label>
              <span>طول هر تایل</span>
              <div><input inputMode="decimal" value={tile.tileLength} onChange={(e) => setTileValue("tileLength", e.target.value)} /><b>سانتی‌متر</b></div>
            </label>
            <label>
              <span>تعداد تایل در هر بسته</span>
              <div><input inputMode="numeric" value={tile.tilesPerBox} onChange={(e) => setTileValue("tilesPerBox", e.target.value)} /><b>عدد</b></div>
            </label>
            <label>
              <span>پرت پیشنهادی</span>
              <div><input inputMode="decimal" value={tile.wastePercent} onChange={(e) => setTileValue("wastePercent", e.target.value)} /><b>٪</b></div>
            </label>
          </div>
        )}

        <button type="button" className="carpet-reset" onClick={() => {
          setRoll(rollDefaults);
          setTile(tileDefaults);
        }}>
          <RotateCcw size={15} /> بازنشانی
        </button>
      </div>

      <aside className="carpet-estimator-result glass-panel" aria-live="polite">
        <span className="section-kicker">نتیجه برآورد</span>

        {mode === "roll" ? (
          !rollResult.valid ? (
            <div className="carpet-result-empty"><strong>ابعاد را کامل وارد کنید.</strong></div>
          ) : (
            <>
              <div className="carpet-main-result">
                <span>متراژ طولی پیشنهادی رول</span>
                <strong>{fa(rollResult.best.linear, 1)} متر طول</strong>
                <small>رول با عرض {fa(rollResult.rollWidth, 2)} متر</small>
              </div>
              <dl className="carpet-result-breakdown">
                <div><dt>مساحت اتاق</dt><dd>{fa(rollResult.roomArea, 2)} مترمربع</dd></div>
                <div><dt>جهت پیشنهادی برش</dt><dd>{rollResult.best.orientation}</dd></div>
                <div><dt>تعداد نوار کامل</dt><dd>{fa(rollResult.best.strips)}</dd></div>
                <div><dt>طول هر نوار</dt><dd>{fa(rollResult.best.cutLength, 2)} متر</dd></div>
                <div><dt>مساحت اسمی خرید</dt><dd>{fa(rollResult.best.purchasedArea, 2)} مترمربع</dd></div>
                <div><dt>پرت لحاظ‌شده</dt><dd>{fa(rollResult.waste)}٪</dd></div>
              </dl>
              {roll.allowRotate && rollResult.alternative.linear !== rollResult.best.linear && (
                <p className="carpet-alt-note">
                  جهت جایگزین حدود {fa(rollResult.alternative.linear, 1)} متر طول مصرف می‌کند. اگر خواب یا طرح موکت جهت مشخصی دارد، جهت نصب از کاهش مصرف مهم‌تر است.
                </p>
              )}
            </>
          )
        ) : (
          !tileResult.valid ? (
            <div className="carpet-result-empty"><strong>ابعاد را کامل وارد کنید.</strong></div>
          ) : (
            <>
              <div className="carpet-main-result">
                <span>پیشنهاد خرید</span>
                <strong>{fa(tileResult.boxes)} بسته</strong>
                <small>{fa(tileResult.purchasedTiles)} تایل در مجموع</small>
              </div>
              <dl className="carpet-result-breakdown">
                <div><dt>مساحت اتاق</dt><dd>{fa(tileResult.roomArea, 2)} مترمربع</dd></div>
                <div><dt>تایل لازم قبل از پرت</dt><dd>{fa(tileResult.rawTiles)}</dd></div>
                <div><dt>تایل لازم با پرت</dt><dd>{fa(tileResult.tilesWithWaste)}</dd></div>
                <div><dt>تایل در هر بسته</dt><dd>{fa(tileResult.perBox)}</dd></div>
                <div><dt>مساحت اسمی خرید</dt><dd>{fa(tileResult.purchasedArea, 2)} مترمربع</dd></div>
                <div><dt>پرت لحاظ‌شده</dt><dd>{fa(tileResult.waste)}٪</dd></div>
              </dl>
            </>
          )
        )}

        <p className="carpet-result-disclaimer">
          این ابزار برای برآورد اولیه خرید است. شکل نامنظم اتاق، کمد ثابت، راهرو، ستون، جهت خواب موکت، Pattern Match، زیرسازی و روش نصب می‌توانند مقدار نهایی را تغییر دهند.
        </p>
      </aside>
    </section>
  );
}
