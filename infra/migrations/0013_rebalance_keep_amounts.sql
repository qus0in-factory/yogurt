CREATE TABLE rebalance_keep_amounts (
  account_id TEXT NOT NULL,
  product_code TEXT NOT NULL CHECK (product_code IN ('01','22','29')),
  keep_amount INTEGER NOT NULL CHECK (
    typeof(keep_amount) = 'integer'
    AND keep_amount >= 0
    AND keep_amount <= 9007199254740991
  ),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, product_code),
  FOREIGN KEY (account_id, product_code) REFERENCES account_products(account_id, product_code) ON DELETE CASCADE
);
