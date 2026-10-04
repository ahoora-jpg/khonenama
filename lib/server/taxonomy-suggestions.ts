import { taxonomySuggestions } from "@/lib/taxonomy-suggestions";

export async function ensureTaxonomySuggestions(db: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS taxonomy_suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, kind TEXT NOT NULL CHECK(kind IN ('category','service')), proposed_name TEXT NOT NULL, selected_categories TEXT NOT NULL, normalized_name TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','rejected')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(business_id, kind, proposed_name))").run();
}

export async function saveTaxonomySuggestions(db: any, businessId: number, body: {categorySuggestion?: unknown; serviceSuggestion?: unknown}, categories: string[]) {
  const suggestions = taxonomySuggestions(body);
  if (!suggestions.length) return;
  await ensureTaxonomySuggestions(db);
  await db.batch(suggestions.map(item => db.prepare("INSERT OR IGNORE INTO taxonomy_suggestions (business_id, kind, proposed_name, selected_categories) VALUES (?, ?, ?, ?)").bind(businessId, item.kind, item.value, JSON.stringify(categories))));
}
