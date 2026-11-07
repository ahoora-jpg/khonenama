import { brandRelationship, brandSlug, normalizeBrandName, type BrandRelationship } from "@/lib/brand-directory";

type Database = any;

export async function saveBrandSuggestions(db: Database, businessId: number, names: string[], relationship: BrandRelationship = "seller") {
  if (!names.length) return;
  await db.batch(names.map((name) => db.prepare(
    "INSERT INTO brand_suggestions (business_id, proposed_name, normalized_name, relationship_type) VALUES (?, ?, ?, ?) " +
    "ON CONFLICT(business_id, normalized_name, relationship_type) DO UPDATE SET proposed_name=excluded.proposed_name, updated_at=CURRENT_TIMESTAMP"
  ).bind(businessId, name, normalizeBrandName(name).toLocaleLowerCase("fa"), relationship)));
}

export async function resolveBrandSuggestion(db: Database, input: { id: number; action: "approve" | "reject"; name?: string; reviewedBy: string }) {
  const suggestion = await db.prepare("SELECT * FROM brand_suggestions WHERE id=? AND status='pending' LIMIT 1").bind(input.id).first();
  if (!suggestion) return null;

  if (input.action === "reject") {
    return db.prepare("UPDATE brand_suggestions SET status='rejected', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING id,status")
      .bind(input.reviewedBy, input.id).first();
  }

  const name = normalizeBrandName(input.name || suggestion.proposed_name);
  if (name.length < 2) return null;
  const normalized = name.toLocaleLowerCase("fa");
  let brand = await db.prepare("SELECT id FROM brands WHERE normalized_name=? LIMIT 1").bind(normalized).first();
  if (!brand) {
    const baseSlug = brandSlug(name) || "brand";
    const suffix = Math.abs([...normalized].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) | 0, 7));
    brand = await db.prepare("INSERT INTO brands(slug,name,normalized_name,status) VALUES(?,?,?,'approved') RETURNING id")
      .bind(`${baseSlug}-${suffix}`, name, normalized).first();
  }
  if (!brand?.id) return null;

  await db.batch([
    db.prepare("INSERT OR IGNORE INTO business_brand_claims(business_id,brand_id,relationship_type,verification_status) VALUES(?,?,?,'self_declared')")
      .bind(suggestion.business_id, brand.id, brandRelationship(suggestion.relationship_type)),
    db.prepare("UPDATE brand_suggestions SET status='approved', resolved_brand_id=?, reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(brand.id, input.reviewedBy, input.id),
  ]);
  return { id: input.id, status: "approved", brandId: Number(brand.id) };
}
