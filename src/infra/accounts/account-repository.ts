import type { Account, AccountInput, AccountUpdate } from '../../domain/accounts/account.ts'
import type { ProductPlanRequest } from '../../domain/accounts/product-plan.ts'
import { reorderAccountIds } from './account-order.ts'
import { encryptText } from './account-crypto.ts'
import { findAccountCredentials } from './account-credentials-repository.ts'
import { toAccount, type AccountRow, type ProductRow } from './account-mapper.ts'

const columns = 'id, alias, owner, account_number, created_at'

async function loadProducts(db: D1Database, id: string): Promise<ProductRow[]> {
  const sql = 'SELECT product_code, start_date, min_target_amount_won, max_target_amount_won FROM account_products WHERE account_id = ?'
  const { results = [] } = await db.prepare(sql).bind(id).all<ProductRow>()
  return results
}

export function createAccountRepository(db: D1Database) {
  return {
    async list(): Promise<Account[]> {
      const { results = [] } = await db.prepare(`SELECT ${columns} FROM accounts ORDER BY sort_order ASC, created_at ASC`).all<AccountRow>()
      return Promise.all(results.map(async row => toAccount(row, await loadProducts(db, row.id))))
    },
    async create(input: AccountInput, keyB64: string): Promise<Account> {
      const [accessKey, secretKey] = await Promise.all([
        encryptText(input.accessKey, keyB64), encryptText(input.secretKey, keyB64),
      ])
      const account: Account = {
        id: crypto.randomUUID(), alias: input.alias, owner: input.owner,
        accountNumber: input.accountNumber, products: [], productPlans: {}, createdAt: new Date().toISOString(),
      }
      await db.prepare('INSERT INTO accounts (id, alias, owner, account_number, access_key_enc, secret_key_enc, created_at, sort_order) SELECT ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order) + 1, 0) FROM accounts')
        .bind(account.id, account.alias, account.owner, account.accountNumber, accessKey, secretKey, account.createdAt).run()
      return account
    },
    async reorder(ids: string[]): Promise<Account[] | null> {
      if (!(await reorderAccountIds(db, ids))) return null
      return this.list()
    },
    async remove(id: string): Promise<boolean> {
      const results = await db.batch([
        db.prepare('DELETE FROM account_products WHERE account_id = ?').bind(id),
        db.prepare('DELETE FROM holding_risk_classes WHERE account_id = ?').bind(id),
        db.prepare('DELETE FROM accounts WHERE id = ?').bind(id),
      ])
      const result = results[2]
      return result.meta.changes > 0
    },
    async update(id: string, input: AccountUpdate): Promise<Account | null> {
      const row = await db.prepare(`UPDATE accounts SET alias = ?, owner = ? WHERE id = ? RETURNING ${columns}`)
        .bind(input.alias, input.owner, id).first<AccountRow>()
      if (!row) return null
      return toAccount(row, await loadProducts(db, id))
    },
    async setProduct(id: string, code: string, enabled: boolean): Promise<Account | null> {
      const row = await db.prepare('SELECT id FROM accounts WHERE id = ?').bind(id).first<{ id: string }>()
      if (!row) return null
      if (enabled) {
        await db.prepare('INSERT OR IGNORE INTO account_products (account_id, product_code) VALUES (?, ?)').bind(id, code).run()
      } else {
        await db.prepare('DELETE FROM account_products WHERE account_id = ? AND product_code = ?').bind(id, code).run()
      }
      const accountRow = await db.prepare(`SELECT ${columns} FROM accounts WHERE id = ?`).bind(id).first<AccountRow>()
      if (!accountRow) return null
      return toAccount(accountRow, await loadProducts(db, id))
    },
    async setProductPlan(id: string, code: string, plan: ProductPlanRequest): Promise<Account | null> {
      const sql = 'UPDATE account_products SET start_date = ?, min_target_amount_won = ?, max_target_amount_won = ? WHERE account_id = ? AND product_code = ?'
      const result = await db.prepare(sql).bind(plan.startDate, plan.minTargetAmountWon, plan.maxTargetAmountWon, id, code).run()
      if (result.meta.changes === 0) return null
      const row = await db.prepare(`SELECT ${columns} FROM accounts WHERE id = ?`).bind(id).first<AccountRow>()
      return row ? toAccount(row, await loadProducts(db, id)) : null
    },
    findCredentials: (id: string, keyB64: string) => findAccountCredentials(db, id, keyB64),
  }
}
