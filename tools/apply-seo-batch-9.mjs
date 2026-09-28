import fs from "node:fs";

const guidePath = "lib/guides.ts";
const categoryPath = "lib/category-seo.ts";

let guides = fs.readFileSync(guidePath, "utf8");
const importLine = 'import { seoBatch9Guides } from "@/lib/guides-seo-batch-9";';
if (!guides.includes(importLine)) {
  const anchor = 'import { seoBatch8Guides } from "@/lib/guides-seo-batch-8";';
  if (!guides.includes(anchor)) throw new Error("Run batch 8 integration first");
  guides = guides.replace(anchor, `${anchor}\n${importLine}`);
}
if (!guides.includes("...seoBatch9Guides,")) {
  const anchor = "export const guides: Guide[] = [\n  ...seoBatch8Guides,\n";
  if (!guides.includes(anchor)) throw new Error("batch 8 guides array anchor not found");
  guides = guides.replace(anchor, `${anchor}  ...seoBatch9Guides,\n`);
}
fs.writeFileSync(guidePath, guides, "utf8");

let category = fs.readFileSync(categoryPath, "utf8");
const oldGuides = 'guides: ["parquet-vs-laminate", "laminate-vs-vinyl-flooring-2026",';
const newGuides = 'guides: ["laminate-ac-rating-usage-class-guide", "waterproof-vs-water-resistant-laminate", "laminate-expansion-gap-guide", "laminate-underfloor-heating-guide", "engineered-wood-vs-laminate", "parquet-vs-laminate", "laminate-vs-vinyl-flooring-2026",';
if (!category.includes("laminate-ac-rating-usage-class-guide")) {
  if (!category.includes(oldGuides)) throw new Error("flooring category guide anchor not found");
  category = category.replace(oldGuides, newGuides);
  fs.writeFileSync(categoryPath, category, "utf8");
}

console.log("SEO batch 9 integrated into guides and flooring pillar.");
