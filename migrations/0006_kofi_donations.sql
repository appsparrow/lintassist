-- Tracks individual Ko-fi donations (email, amount, currency) so the
-- admin dashboard can report real totals ("N supporters, $X donated")
-- instead of just the binary "got the 50-credit bonus" the subscribers
-- table alone can tell you. kofi_transaction_id is UNIQUE so the same
-- webhook delivery (Ko-fi retries on non-200) can never be double-counted
-- — /webhook/kofi checks this via INSERT OR IGNORE before granting credits.
CREATE TABLE IF NOT EXISTS kofi_donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  kofi_transaction_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kofi_donations_email ON kofi_donations(email);
