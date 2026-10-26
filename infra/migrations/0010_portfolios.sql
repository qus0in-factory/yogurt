CREATE TABLE portfolios (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE portfolio_items (
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 99),
  kind TEXT NOT NULL CHECK (kind IN ('security','cash')),
  stock_code TEXT,
  stock_name TEXT NOT NULL CHECK (length(trim(stock_name)) BETWEEN 1 AND 80),
  target_weight_bps INTEGER NOT NULL CHECK (typeof(target_weight_bps) = 'integer' AND target_weight_bps BETWEEN 1 AND 10000),
  PRIMARY KEY (portfolio_id, position),
  CHECK (
    (kind = 'security' AND stock_code IS NOT NULL AND length(stock_code) BETWEEN 1 AND 20)
    OR (kind = 'cash' AND stock_code IS NULL)
  )
);

CREATE UNIQUE INDEX portfolio_security_code ON portfolio_items(portfolio_id, stock_code) WHERE kind = 'security';
CREATE UNIQUE INDEX portfolio_cash_item ON portfolio_items(portfolio_id) WHERE kind = 'cash';

CREATE TABLE portfolio_assignments (
  account_id TEXT NOT NULL,
  product_code TEXT NOT NULL CHECK (product_code IN ('01','22','29')),
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE RESTRICT,
  PRIMARY KEY (account_id, product_code),
  FOREIGN KEY (account_id, product_code) REFERENCES account_products(account_id, product_code) ON DELETE CASCADE
);

CREATE INDEX portfolio_assignments_portfolio ON portfolio_assignments(portfolio_id);
