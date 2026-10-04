export function normalizeTaxonomySuggestion(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
    : "";
}

export function taxonomySuggestions(body: { categorySuggestion?: unknown; serviceSuggestion?: unknown }) {
  return (["category", "service"] as const).flatMap((kind) => {
    const value = normalizeTaxonomySuggestion(kind === "category" ? body.categorySuggestion : body.serviceSuggestion);
    return value.length >= 2 ? [{ kind, value }] : [];
  });
}
