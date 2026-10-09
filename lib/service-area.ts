export function parseServiceArea(value: string, defaultCity: string) {
 const clean=value.trim().slice(0,100);
 if (/^(تمام|کل)\s+/.test(clean)) {const city=clean.replace(/^(تمام|کل)\s+/, "").trim();return {city,area:"تمام "+city};}
 const parts=clean.split(" / ");if(parts.length>1 && /^(تمام|کل)\s+/.test(parts.slice(1).join(" / "))) return parseServiceArea(parts.slice(1).join(" / "),parts[0].trim());return parts.length>1?{city:parts[0].trim(),area:parts.slice(1).join(" / ").trim()}:{city:defaultCity,area:clean};
}
export function normalizeServiceAreas(values: string[], defaultCity: string) {
 const rows=values.map(value=>parseServiceArea(value,defaultCity));
 const whole=new Set(rows.filter(r=>r.area==="تمام "+r.city).map(r=>r.city));
 return [...new Set(rows.filter(r=>!whole.has(r.city)||r.area==="تمام "+r.city).map(r=>r.area==="تمام "+r.city?r.area:r.city&&r.city!==defaultCity?r.city+" / "+r.area:r.area))];
}
