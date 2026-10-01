CREATE TABLE IF NOT EXISTS business_albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_business_albums_owner ON business_albums(business_id, id);
CREATE TABLE IF NOT EXISTS business_album_media (
  album_id INTEGER NOT NULL REFERENCES business_albums(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES business_media(id) ON DELETE CASCADE,
  PRIMARY KEY(album_id, media_id)
);
