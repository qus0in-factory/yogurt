CREATE TABLE account_products (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  PRIMARY KEY (account_id, product_code)
);
INSERT INTO account_products (account_id, product_code)
SELECT id, '29' FROM accounts WHERE product_code = '29';
