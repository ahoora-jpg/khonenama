-- Aggregate-only attribution. No account, phone, IP address, or form content.
CREATE TABLE IF NOT EXISTS seller_acquisition_daily (
  event_date TEXT NOT NULL,
  source TEXT NOT NULL,
  event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_date, source, event)
);
