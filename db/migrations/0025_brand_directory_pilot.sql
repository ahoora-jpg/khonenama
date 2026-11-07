-- Internal-only pilot catalogue. These records are not public pages and have no logo or catalogue asset.
CREATE TABLE IF NOT EXISTS brand_categories (
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (brand_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_categories_category ON brand_categories(category_id, brand_id);

INSERT OR IGNORE INTO brands (slug, name, normalized_name, status) VALUES
  ('saba-pardeh', 'صبا پرده', 'صبا پرده', 'approved'),
  ('iran-zebra', 'ایران زبرا', 'ایران زبرا', 'approved'),
  ('decor-pardeh', 'دکورپرده', 'دکورپرده', 'approved'),
  ('zarif-mosavar', 'ظریف مصور', 'ظریف مصور', 'approved'),
  ('isofam', 'ایزوفام', 'ایزوفام', 'approved'),
  ('viniflex', 'وینیفلکس', 'وینیفلکس', 'approved'),
  ('partak', 'پارتاک', 'پارتاک', 'approved'),
  ('part-safheh', 'پارت صفحه', 'پارت صفحه', 'approved'),
  ('extreme-walls', 'اکستریم والز', 'اکستریم والز', 'approved');

INSERT OR IGNORE INTO brand_categories (brand_id, category_id)
SELECT b.id, c.id FROM brands b JOIN categories c
WHERE (b.normalized_name IN ('صبا پرده','ایران زبرا','دکورپرده') AND c.slug='curtain')
   OR (b.normalized_name IN ('ظریف مصور','ایزوفام') AND c.slug='carpet')
   OR (b.normalized_name IN ('وینیفلکس','پارتاک') AND c.slug='flooring')
   OR (b.normalized_name IN ('پارت صفحه','اکستریم والز') AND c.slug='wallpaper');
