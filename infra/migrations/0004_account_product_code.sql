ALTER TABLE accounts ADD COLUMN product_code TEXT NOT NULL DEFAULT '01';
UPDATE accounts SET product_code = '29' WHERE upper(alias) LIKE '%IRP%';
