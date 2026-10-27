import type { KeepAmountProductCode } from '../../domain/rebalance/keep-amount'

const TARGET = 'SELECT account_id FROM account_products WHERE account_id = ? AND product_code = ?'
const SELECT = 'SELECT keep_amount FROM rebalance_keep_amounts WHERE account_id = ? AND product_code = ?'
const UPSERT = `INSERT INTO rebalance_keep_amounts (account_id, product_code, keep_amount, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(account_id, product_code) DO UPDATE SET
    keep_amount = excluded.keep_amount, updated_at = excluded.updated_at`

export async function keepAmountTargetExists(db: D1Database, accountId: string, productCode: KeepAmountProductCode): Promise<boolean> {
  const row = await db.prepare(TARGET).bind(accountId, productCode).first<{ account_id: string }>()
  return Boolean(row)
}

export async function getKeepAmount(db: D1Database, accountId: string, productCode: KeepAmountProductCode): Promise<number> {
  const row = await db.prepare(SELECT).bind(accountId, productCode).first<{ keep_amount: number }>()
  return row?.keep_amount ?? 0
}

export async function saveKeepAmount(
  db: D1Database, accountId: string, productCode: KeepAmountProductCode, keepAmount: number,
): Promise<void> {
  await db.prepare(UPSERT).bind(accountId, productCode, keepAmount, new Date().toISOString()).run()
}
