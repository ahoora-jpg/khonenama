const CHAR_MAP: Record<string, string> = {
  "ا": "a", "آ": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s",
  "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z",
  "ر": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s",
  "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f",
  "ق": "gh", "ک": "k", "ك": "k", "گ": "g", "ل": "l", "م": "m",
  "ن": "n", "و": "v", "ه": "h", "ی": "y", "ي": "y", "ئ": "y",
  "ء": "", "ؤ": "v", "ة": "h",
};

const RESERVED = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "register",
  "search",
  "business",
  "category",
  "magazine",
  "karaj",
  "support",
  "about",
  "pricing",
  "settings",
  "billing",
]);

function transliterate(value: string) {
  return Array.from(value)
    .map((char) => CHAR_MAP[char] ?? char)
    .join("");
}

export function normalizeBusinessSlug(value: string) {
  const ascii = transliterate(value.toLowerCase())
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return ascii;
}

export function validateBusinessSlug(value: string) {
  const slug = normalizeBusinessSlug(value);
  if (slug.length < 3) return { ok: false as const, error: "SLUG_TOO_SHORT", slug };
  if (RESERVED.has(slug)) return { ok: false as const, error: "SLUG_RESERVED", slug };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false as const, error: "SLUG_INVALID", slug };
  }
  return { ok: true as const, slug };
}

export function businessSlugBase(name: string, city?: string) {
  const combined = [name, city].filter(Boolean).join(" ");
  const normalized = normalizeBusinessSlug(combined);
  return normalized.length >= 3 ? normalized : "business";
}

export async function createUniqueBusinessSlug(
  db: any,
  name: string,
  city?: string
) {
  const base = businessSlugBase(name, city);
  for (let index = 0; index < 50; index += 1) {
    const suffix = index === 0 ? "" : "-" + String(index + 1);
    const candidate = (base + suffix).slice(0, 64);
    const [current, historic] = await Promise.all([
      db.prepare("SELECT id FROM businesses WHERE slug = ? LIMIT 1").bind(candidate).first(),
      db.prepare("SELECT business_id FROM business_slug_history WHERE old_slug = ? LIMIT 1").bind(candidate).first().catch(() => null),
    ]);
    if (!current?.id && !historic?.business_id && !RESERVED.has(candidate)) return candidate;
  }

  return base.slice(0, 50) + "-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}
