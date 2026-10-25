import type { Context } from 'hono'
import { isValidEncryptionKey } from '../accounts/account-crypto.ts'
import { createAccountRepository } from '../accounts/account-repository.ts'
import { createKisClient } from './kis-client.ts'

export function kisClientFromEnv(c: Context<{ Bindings: Env }>, fetchFn: typeof fetch = fetch) {
  const { DB, ACCOUNT_ENCRYPTION_KEY: key, CACHE: cache } = c.env
  if (!DB || !key || !isValidEncryptionKey(key) || !cache) return null
  return createKisClient({ cache, repository: createAccountRepository(DB), key, fetchFn })
}
