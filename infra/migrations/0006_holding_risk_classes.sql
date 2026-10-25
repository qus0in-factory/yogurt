CREATE TABLE holding_risk_classes (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  stock_code TEXT NOT NULL,
  risk_class TEXT NOT NULL CHECK (risk_class IN ('risk','safe')),
  PRIMARY KEY (account_id, product_code, stock_code)
);
