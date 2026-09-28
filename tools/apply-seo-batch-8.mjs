import fs from "node:fs";

const guidePath = "lib/guides.ts";
const categoryPath = "lib/category-seo.ts";

let guides = fs.readFileSync(guidePath, "utf8");
const importLine = 'import { seoBatch8Guides } from "@/lib/guides-seo-batch-8";';
if (!guides.includes(importLine)) {
  const anchor = 'import { seoBatch7Guides } from "@/lib/guides-seo-batch-7";';
  if (!guides.includes(anchor)) throw new Error("guides import anchor not found");
  guides = guides.replace(anchor, `${anchor}\n${importLine}`);
}
if (!guides.includes("...seoBatch8Guides,")) {
  const anchor = "export const guides: Guide[] = [\n";
  if (!guides.includes(anchor)) throw new Error("guides array anchor not found");
  guides = guides.replace(anchor, `${anchor}  ...seoBatch8Guides,\n`);
}
fs.writeFileSync(guidePath, guides, "utf8");

let category = fs.readFileSync(categoryPath, "utf8");
const oldGuides = 'guides: ["zebra-curtain-guide", "zebra-vs-shade", "shade-curtain-guide", "blackout-curtain-guide",';
const newGuides = 'guides: ["cellular-honeycomb-shades-guide", "solar-shades-openness-guide", "blackout-vs-room-darkening", "inside-vs-outside-mount-shades", "top-down-bottom-up-shades-guide", "cellular-vs-roller-shades", "zebra-curtain-guide", "zebra-vs-shade", "shade-curtain-guide", "blackout-curtain-guide",';
if (!category.includes("cellular-honeycomb-shades-guide")) {
  if (!category.includes(oldGuides)) throw new Error("curtain category guide anchor not found");
  category = category.replace(oldGuides, newGuides);
  fs.writeFileSync(categoryPath, category, "utf8");
}

console.log("SEO batch 8 integrated into guides and curtain pillar.");
