ALTER TABLE accounts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE accounts
SET sort_order = (SELECT COUNT(*) FROM accounts a2 WHERE a2.created_at < accounts.created_at);
