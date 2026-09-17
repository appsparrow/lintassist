-- Per-request log: one row per /analyze call, used by the admin panel to
-- show request counts, cost, and model mix per user.
CREATE TABLE IF NOT EXISTS request_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  token         TEXT NOT NULL,
  engine        TEXT NOT NULL,             -- 'Q' | 'D' | 'C'
  model         TEXT NOT NULL,             -- exact model id that served it
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      REAL NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_request_log_token ON request_log(token);
CREATE INDEX IF NOT EXISTS idx_request_log_created ON request_log(created_at);
