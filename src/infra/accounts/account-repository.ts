import type { Account, AccountInput, AccountUpdate } from '../../domain/accounts/account.ts'
import { reorderAccountIds } from './account-order.ts'
import { encryptText, decryptText } from './account-crypto.ts'

type AccountRow = { id: string; alias: string; owner: string; account_number: string; product_code: string; created_at: string }
type ProductRow = { product_code: string }
const columns = 'id, alias, owner, account_number, created_at'

function toAccount(row: AccountRow, products: string[]): Account {
  return { id: row.id, alias: row.alias, owner: row.owner, accountNumber: row.account_number, products, createdAt: row.created_at }
}

async function loadProducts(db: D1Database, id: string): Promise<string[]> {
  const { results = [] } = await db.prepare('SELECT product_code FROM account_products WHERE account_id = ?').bind(id).all<ProductRow>()
  return results.map((row) => row.product_code)
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
        accountNumber: input.accountNumber, products: [], createdAt: new Date().toISOString(),
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
    async findCredentials(id: string, keyB64: string): Promise<{ accessKey: string; secretKey: string; accountNumber: string; productCode: string } | null> {
      const row = await db.prepare('SELECT access_key_enc, secret_key_enc, account_number, product_code FROM accounts WHERE id = ?').bind(id).first<{ access_key_enc: string; secret_key_enc: string; account_number: string; product_code: string }>()
      if (!row) return null
      try {
        const [accessKey, secretKey] = await Promise.all([
          decryptText(row.access_key_enc, keyB64), decryptText(row.secret_key_enc, keyB64),
        ])
        return { accessKey, secretKey, accountNumber: row.account_number, productCode: row.product_code }
      } catch {
        return null
      }
    },
  }
}
