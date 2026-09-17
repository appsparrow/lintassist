-- Anti-abuse controls for the free-tier self-serve signup (POST /access).
-- `settings` is a plain key/value store the admin panel reads and writes.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('free_signup_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('free_signup_daily_cap', '20');
INSERT OR IGNORE INTO settings (key, value) VALUES ('free_signup_ip_daily_cap', '2');

-- One row per (ip, day) — counts *new* signups only (not idempotent
-- lookups of an email that already has a token), so returning users
-- never count against the per-IP limit.
CREATE TABLE IF NOT EXISTS signup_ip_log (
  ip      TEXT NOT NULL,
  day_key TEXT NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day_key)
);
