import type { Account, AccountInput } from '../../domain/accounts/account.ts'
import { encryptText } from './account-crypto.ts'

type AccountRow = { id: string; alias: string; account_number: string; created_at: string }

export function createAccountRepository(db: D1Database) {
  return {
    async list(): Promise<Account[]> {
      const { results = [] } = await db.prepare(
        'SELECT id, alias, account_number, created_at FROM accounts ORDER BY created_at ASC',
      ).all<AccountRow>()
      return results.map(({ id, alias, account_number, created_at }) => ({
        id, alias, accountNumber: account_number, createdAt: created_at,
      }))
    },
    async create(input: AccountInput, keyB64: string): Promise<Account> {
      const [accessKey, secretKey] = await Promise.all([
        encryptText(input.accessKey, keyB64), encryptText(input.secretKey, keyB64),
      ])
      const account: Account = {
        id: crypto.randomUUID(), alias: input.alias,
        accountNumber: input.accountNumber, createdAt: new Date().toISOString(),
      }
      await db.prepare('INSERT INTO accounts (id, alias, account_number, access_key_enc, secret_key_enc, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(account.id, account.alias, account.accountNumber, accessKey, secretKey, account.createdAt).run()
      return account
    },
  }
}
