-- D1 schema. Safe to run more than once.
-- WITHOUT ROWID: the primary key is the table, so no extra index is written per hit.
-- Raw tables (pruned after 100 days).
CREATE TABLE IF NOT EXISTS hits (
  day TEXT NOT NULL,          -- UTC YYYY-MM-DD
  file TEXT NOT NULL,         -- exact basename, e.g. reversim522-company_brain.mp3
  listener TEXT NOT NULL,     -- 32 hex chars, salted hash
  app TEXT, ua_type TEXT, device TEXT, country TEXT,
  size INTEGER NOT NULL,      -- total file size in bytes
  bytes INTEGER NOT NULL,     -- sum of bytes served
  reqs INTEGER NOT NULL,
  first_ts INTEGER NOT NULL,  -- unix seconds
  PRIMARY KEY (day, file, listener)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS feed_hits (
  day TEXT NOT NULL,
  listener TEXT NOT NULL,
  app TEXT, ua_type TEXT,
  subs INTEGER,               -- max subscriber count reported in the UA
  reqs INTEGER NOT NULL,
  PRIMARY KEY (day, listener)
) WITHOUT ROWID;

-- Rollup tables (kept forever, rebuilt by the hourly cron).
CREATE TABLE IF NOT EXISTS ep_daily (
  day TEXT NOT NULL, file TEXT NOT NULL, downloads INTEGER NOT NULL, listeners INTEGER NOT NULL,
  PRIMARY KEY (day, file)
) WITHOUT ROWID;
-- The episodes query groups by file over all days.
CREATE INDEX IF NOT EXISTS ep_daily_file ON ep_daily (file);

CREATE TABLE IF NOT EXISTS dim_daily (
  day TEXT NOT NULL, dim TEXT NOT NULL, key TEXT NOT NULL, downloads INTEGER NOT NULL,
  PRIMARY KEY (day, dim, key)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS totals_daily (
  day TEXT PRIMARY KEY, downloads INTEGER NOT NULL, listeners INTEGER NOT NULL,
  requests INTEGER NOT NULL, bot_requests INTEGER NOT NULL, unqualified INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS totals_monthly (
  month TEXT PRIMARY KEY, downloads INTEGER NOT NULL, listeners INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS audience_daily (
  day TEXT PRIMARY KEY, active_30d INTEGER NOT NULL, idle_31_90d INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS feed_daily (
  day TEXT NOT NULL, app TEXT NOT NULL, fetchers INTEGER NOT NULL, reqs INTEGER NOT NULL,
  subs INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, app)
) WITHOUT ROWID;
