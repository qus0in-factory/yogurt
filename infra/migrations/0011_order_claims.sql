CREATE TABLE order_claims (
  request_id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('claimed','sending','succeeded','unknown')),
  order_no TEXT,
  accepted_at TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL
);
