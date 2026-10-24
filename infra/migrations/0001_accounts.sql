CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  alias TEXT NOT NULL,
  account_number TEXT NOT NULL,
  access_key_enc TEXT NOT NULL,
  secret_key_enc TEXT NOT NULL,
  created_at TEXT NOT NULL
);
