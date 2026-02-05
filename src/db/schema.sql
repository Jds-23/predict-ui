-- Wallet table (single row for user balance)
CREATE TABLE IF NOT EXISTS wallet (
  id INTEGER PRIMARY KEY DEFAULT 1,
  balance REAL NOT NULL DEFAULT 100
);

-- Initialize wallet with starting balance
INSERT OR IGNORE INTO wallet (id, balance) VALUES (1, 100);

-- Stakes table
CREATE TABLE IF NOT EXISTS stakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  box_key TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  multiplier REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'settling-won', 'settling-lost', 'won', 'lost')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for quick lookups by box_key
CREATE INDEX IF NOT EXISTS idx_stakes_box_key ON stakes(box_key);

-- Index for pending stakes
CREATE INDEX IF NOT EXISTS idx_stakes_status ON stakes(status);
