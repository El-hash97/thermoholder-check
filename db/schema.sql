-- Run this once against your Neon database (Neon SQL Editor or `psql "$DATABASE_URL" -f db/schema.sql`)

CREATE TABLE IF NOT EXISTS month_settings (
  month TEXT PRIMARY KEY,
  quickchecker_ref INTEGER NOT NULL DEFAULT 1500,
  std_tolerance INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL REFERENCES month_settings(month) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  shift_group TEXT NOT NULL,
  entry_timestamp TIMESTAMPTZ NOT NULL,
  values_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_month ON entries(month);
