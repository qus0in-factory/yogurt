import type { Context } from 'hono'
import type { AccountInput } from '../domain/account.ts'
import { isValidEncryptionKey } from './account-crypto.ts'
import { createAccountRepository } from './account-repository.ts'

type AppContext = Context<{ Bindings: Env }>
const CONFIG_ERROR = { error: 'accounts storage is not configured' }

function configured(c: AppContext) {
  const key = c.env.ACCOUNT_ENCRYPTION_KEY
  if (!c.env.DB || !key || !isValidEncryptionKey(key)) return null
  return { repository: createAccountRepository(c.env.DB), key }
}

export async function listAccounts(c: AppContext): Promise<Response> {
  const setup = configured(c)
  if (!setup) return c.json(CONFIG_ERROR, 503)
  return c.json(await setup.repository.list())
}

export async function createAccount(c: AppContext, input: AccountInput): Promise<Response> {
  const setup = configured(c)
  if (!setup) return c.json(CONFIG_ERROR, 503)
  const account = await setup.repository.create(input, setup.key)
  return c.json(account, 201)
}
