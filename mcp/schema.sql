-- Episode archive for the MCP server. scripts/mcp-export.mjs writes seed.sql, which drops and fills these tables.
DROP TABLE IF EXISTS episodes_fts;
DROP TABLE IF EXISTS passages_fts;
DROP TABLE IF EXISTS passages;
DROP TABLE IF EXISTS episodes;

CREATE TABLE episodes (
  id TEXT PRIMARY KEY,          -- post id, for example 2026-11-522-company-brain-with-shmulik-from-lusha
  number INTEGER,               -- episode number, NULL for specials
  title TEXT NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  url TEXT NOT NULL,
  audio_url TEXT,
  seconds INTEGER,
  kind TEXT, guests TEXT, companies TEXT, topics TEXT, hook TEXT,
  notes TEXT NOT NULL,          -- show notes as plain text
  has_transcript INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;
CREATE INDEX episodes_number ON episodes(number);

-- A passage is about one minute of the transcript.
CREATE TABLE passages (
  rowid INTEGER PRIMARY KEY,
  episode_id TEXT NOT NULL,
  start INTEGER NOT NULL,       -- seconds from the start of the audio
  text TEXT NOT NULL            -- "speaker: words" lines
);
CREATE INDEX passages_episode ON passages(episode_id, start);

-- Trigram tokens find Hebrew words with prefixes (ה, ו, ב, ש...) and parts of English terms.
CREATE VIRTUAL TABLE episodes_fts USING fts5(id UNINDEXED, title, guests, companies, hook, notes, tokenize = 'trigram');
CREATE VIRTUAL TABLE passages_fts USING fts5(text, content = 'passages', content_rowid = 'rowid', tokenize = 'trigram');
