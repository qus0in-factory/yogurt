import type { Account, AccountInput, AccountUpdate } from '../../domain/accounts/account.ts'
import { decryptText, encryptText } from './account-crypto.ts'

type AccountRow = { id: string; alias: string; owner: string; account_number: string; product_code: string; created_at: string }
const columns = 'id, alias, owner, account_number, product_code, created_at'
function toAccount(row: AccountRow): Account {
  return { id: row.id, alias: row.alias, owner: row.owner, accountNumber: row.account_number, productCode: row.product_code, createdAt: row.created_at }
}

export function createAccountRepository(db: D1Database) {
  return {
    async list(): Promise<Account[]> {
      const { results = [] } = await db.prepare(
        `SELECT ${columns} FROM accounts ORDER BY created_at ASC`,
      ).all<AccountRow>()
      return results.map(toAccount)
    },
    async create(input: AccountInput, keyB64: string): Promise<Account> {
      const [accessKey, secretKey] = await Promise.all([
        encryptText(input.accessKey, keyB64), encryptText(input.secretKey, keyB64),
      ])
      const account: Account = {
        id: crypto.randomUUID(), alias: input.alias, owner: input.owner,
        accountNumber: input.accountNumber, productCode: input.productCode, createdAt: new Date().toISOString(),
      }
      await db.prepare('INSERT INTO accounts (id, alias, owner, account_number, product_code, access_key_enc, secret_key_enc, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(account.id, account.alias, account.owner, account.accountNumber, account.productCode, accessKey, secretKey, account.createdAt).run()
      return account
    },
    async remove(id: string): Promise<boolean> {
      const result = await db.prepare('DELETE FROM accounts WHERE id = ?').bind(id).run()
      return result.meta.changes > 0
    },
    async update(id: string, input: AccountUpdate): Promise<Account | null> {
      const row = await db.prepare(`UPDATE accounts SET alias = ?, owner = ?, product_code = ? WHERE id = ? RETURNING ${columns}`)
        .bind(input.alias, input.owner, input.productCode, id).first<AccountRow>()
      return row ? toAccount(row) : null
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
