-- Public pilot directory. Brand pages contain only first-party names, text and
-- outbound source links; no external logo, photo, PDF or catalogue is copied.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS brand_product_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK(reference_type IN ('product_page','category_page','catalogue','website')),
  source_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (brand_id, source_url)
);
CREATE INDEX IF NOT EXISTS idx_brand_product_references_public ON brand_product_references(brand_id, sort_order, id);

UPDATE brands
SET status='published',
    official_url=CASE slug
      WHEN 'saba-pardeh' THEN 'https://sabaparde.com/'
      WHEN 'iran-zebra' THEN 'https://iranzebra.ir/'
      WHEN 'decor-pardeh' THEN 'https://www.decorpardeh.com/'
      WHEN 'zarif-mosavar' THEN 'https://www.zarifmosavar.com/'
      WHEN 'isofam' THEN 'https://isofam.ir/fa/'
      WHEN 'viniflex' THEN 'https://vinyflex.com/'
      WHEN 'partak' THEN 'https://partack.co/'
      WHEN 'part-safheh' THEN 'https://partsafhe.com/'
      WHEN 'extreme-walls' THEN 'https://extreme-walls.com/'
      ELSE official_url END,
    description=CASE slug
      WHEN 'saba-pardeh' THEN 'مرجع اولیه محصولات پرده، زبرا و شید.'
      WHEN 'iran-zebra' THEN 'مرجع اولیه پرده زبرا، شید و دابل شید.'
      WHEN 'decor-pardeh' THEN 'مرجع اولیه انواع پرده، شید و دومکانیزم.'
      WHEN 'zarif-mosavar' THEN 'مرجع اولیه کاتالوگ محصولات موکت.'
      WHEN 'isofam' THEN 'مرجع اولیه MDF، پارکت و کفپوش لمینت.'
      WHEN 'viniflex' THEN 'مرجع اولیه کفپوش‌های مسکونی، اداری و تجاری.'
      WHEN 'partak' THEN 'مرجع اولیه دیوارپوش، کفپوش و ترمووال PVC.'
      WHEN 'part-safheh' THEN 'مرجع اولیه دیوارپوش، ترمووال، کفپوش و تایل PVC.'
      WHEN 'extreme-walls' THEN 'مرجع اولیه آلبوم‌ها و کاتالوگ‌های دیوارپوش.'
      ELSE description END,
    published_at=COALESCE(published_at, CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('saba-pardeh','iran-zebra','decor-pardeh','zarif-mosavar','isofam','viniflex','partak','part-safheh','extreme-walls');

-- Isofam belongs with flooring, not carpet.
DELETE FROM brand_categories WHERE brand_id=(SELECT id FROM brands WHERE slug='isofam') AND category_id=(SELECT id FROM categories WHERE slug='carpet');
INSERT OR IGNORE INTO brand_categories(brand_id,category_id) SELECT id,(SELECT id FROM categories WHERE slug='flooring') FROM brands WHERE slug='isofam';

INSERT OR IGNORE INTO brand_product_references(brand_id,title,reference_type,source_url,sort_order)
SELECT id,'فهرست محصولات','category_page','https://sabaparde.com/محصولات',10 FROM brands WHERE slug='saba-pardeh'
UNION ALL SELECT id,'پرده زبرا','category_page','https://sabaparde.com/زبرا',20 FROM brands WHERE slug='saba-pardeh'
UNION ALL SELECT id,'شید رول تک‌لایه','category_page','https://sabaparde.com/شید-رول-تک-لایه',30 FROM brands WHERE slug='saba-pardeh'
UNION ALL SELECT id,'فهرست محصولات','category_page','https://iranzebra.ir/product/',10 FROM brands WHERE slug='iran-zebra'
UNION ALL SELECT id,'پرده زبرا','category_page','https://iranzebra.ir/product/zebra-curtain/',20 FROM brands WHERE slug='iran-zebra'
UNION ALL SELECT id,'پرده شید','category_page','https://iranzebra.ir/product/shade-curtain/',30 FROM brands WHERE slug='iran-zebra'
UNION ALL SELECT id,'دابل شید','category_page','https://iranzebra.ir/product/double-shad/',40 FROM brands WHERE slug='iran-zebra'
UNION ALL SELECT id,'فهرست محصولات','category_page','https://www.decorpardeh.com/خرید-پرده/',10 FROM brands WHERE slug='decor-pardeh'
UNION ALL SELECT id,'دومکانیزم راشل چاپی','product_page','https://www.decorpardeh.com/product/دومکانیزم-راشل-چاپی/',20 FROM brands WHERE slug='decor-pardeh'
UNION ALL SELECT id,'دومکانیزم اسپرت','product_page','https://www.decorpardeh.com/product/دومکانیزم-اسپرت/',30 FROM brands WHERE slug='decor-pardeh'
UNION ALL SELECT id,'کاتالوگ محصولات','catalogue','https://www.zarifmosavar.com/?Page=Products_Catalog',10 FROM brands WHERE slug='zarif-mosavar'
UNION ALL SELECT id,'کاتالوگ‌ها','catalogue','https://isofam.ir/fa/catalog/',10 FROM brands WHERE slug='isofam'
UNION ALL SELECT id,'کاتالوگ لمینت','catalogue','https://isofam.ir/fa/wp-content/uploads/2025/05/laminate-flooring-Catalog.pdf',20 FROM brands WHERE slug='isofam'
UNION ALL SELECT id,'فورتیس','product_page','https://vinyflex.com/فورتیس/',10 FROM brands WHERE slug='viniflex'
UNION ALL SELECT id,'مایا','product_page','https://vinyflex.com/کفپوش-مایا/',20 FROM brands WHERE slug='viniflex'
UNION ALL SELECT id,'دومینو','product_page','https://vinyflex.com/کفپوش-دومینو/',30 FROM brands WHERE slug='viniflex'
UNION ALL SELECT id,'آیکا','product_page','https://vinyflex.com/کفپوش-آیکا/',40 FROM brands WHERE slug='viniflex'
UNION ALL SELECT id,'وب‌سایت و فهرست محصولات','website','https://partack.co/',10 FROM brands WHERE slug='partak'
UNION ALL SELECT id,'فهرست محصولات','category_page','https://partsafhe.com/محصولات/',10 FROM brands WHERE slug='part-safheh'
UNION ALL SELECT id,'ترمووال PVC عرض ۴ سانتی‌متر','product_page','https://partsafhe.com/product/ترمووال-pvc-عرض-4-سانتی-متر/',20 FROM brands WHERE slug='part-safheh'
UNION ALL SELECT id,'کفپوش PVC سایز ۲۰ در ۱۲۰','product_page','https://partsafhe.com/product/کفپوش-pvc-سایز-20-در-120-سانتی-متر/',30 FROM brands WHERE slug='part-safheh'
UNION ALL SELECT id,'آلبوم هیدروژن','category_page','https://extreme-walls.com/hydrogen-album/',10 FROM brands WHERE slug='extreme-walls'
UNION ALL SELECT id,'کاتالوگ هیدروژن','catalogue','https://extreme-walls.com/catalog/HYDROGEN-catalog.pdf',20 FROM brands WHERE slug='extreme-walls'
UNION ALL SELECT id,'کاتالوگ H2O','catalogue','https://extreme-walls.com/catalog/H2O-Catalog.pdf',30 FROM brands WHERE slug='extreme-walls'
UNION ALL SELECT id,'کاتالوگ اتم','catalogue','https://extreme-walls.com/catalog/DigitalCatalogAtom.pdf',40 FROM brands WHERE slug='extreme-walls'
UNION ALL SELECT id,'کاتالوگ تیتانیوم','catalogue','https://extreme-walls.com/catalog/TITANIUM-catalog.pdf',50 FROM brands WHERE slug='extreme-walls';
