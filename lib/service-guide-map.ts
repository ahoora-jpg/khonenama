// Resolve newly selectable services to a relevant guide, never the generic archive.
export function supportingGuide(category: string, name: string): string {
  if (category === "curtain") {
    if (/ریپل|ویو/.test(name)) return "ripple-fold-vs-pinch-pleat-vs-grommet";
    if (/دوطرفه بالا و پایین/.test(name)) return "top-down-bottom-up-shades-guide";
    if (/سلولی/.test(name)) return "cellular-honeycomb-shades-guide";
    if (/بافته طبیعی/.test(name)) return "bamboo-woven-curtain-guide";
    if (/کرکره طرح چوب/.test(name)) return "venetian-blind-guide";
    if (/مینیمال/.test(name)) return "minimalist-curtain-guide";
    return "specialty-curtain-selection-guide";
  }
  if (category === "flooring") return /چوب مهندسی/.test(name) ? "engineered-wood-vs-laminate" : "specialty-flooring-selection-guide";
  if (category === "carpet") return "carpet-construction-fiber-selection-guide";
  if (category === "wallpaper") return "specialty-wallcovering-selection-guide";
  if (category === "interior-design") return "interior-design-process";
  if (category === "smart-home") return "smart-home-guide";
  if (category === "lighting") return "interior-lighting-guide";
  return "";
}
