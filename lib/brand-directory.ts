export type BrandRelationship = "seller" | "installer" | "representative";

const RELATIONSHIPS = new Set<BrandRelationship>(["seller", "installer", "representative"]);

export function normalizeBrandName(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200f]/g, " ")
    .replace(/[^\p{L}\p{N}&().\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function brandSlug(name: string) {
  return normalizeBrandName(name).toLowerCase().replace(/\s+/g, "-").slice(0, 80);
}

export function brandNamesFromInput(value: unknown) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[،,\n]/) : [];
  const unique = new Map<string, string>();
  for (const item of source) {
    const name = normalizeBrandName(item);
    if (name.length >= 2) unique.set(name.toLocaleLowerCase("fa"), name);
  }
  return [...unique.values()].slice(0, 5);
}

export function brandRelationship(value: unknown): BrandRelationship {
  return typeof value === "string" && RELATIONSHIPS.has(value as BrandRelationship)
    ? value as BrandRelationship
    : "seller";
}
