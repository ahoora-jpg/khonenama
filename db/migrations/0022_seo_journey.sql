CREATE TABLE IF NOT EXISTS seo_journey_daily (
  event_date TEXT NOT NULL,
  source TEXT NOT NULL,
  path TEXT NOT NULL,
  event TEXT NOT NULL,
  target_group TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_date, source, path, event, target_group)
);

CREATE INDEX IF NOT EXISTS idx_seo_journey_daily_date
  ON seo_journey_daily(event_date);

CREATE INDEX IF NOT EXISTS idx_seo_journey_daily_event
  ON seo_journey_daily(event, event_date);
