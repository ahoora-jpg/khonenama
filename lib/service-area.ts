export function parseServiceArea(value: string, defaultCity: string) {
  const clean = value.trim().slice(0, 100);
  if (clean.startsWith("تمام ")) return { city: clean.slice(5).trim(), area: clean };
  const parts = clean.split(" / ");
  return parts.length > 1 ? { city: parts[0].trim(), area: parts.slice(1).join(" / ").trim() } : { city: defaultCity, area: clean };
}
