import type { Context } from 'hono'
import type { AccountInput, AccountUpdate, AccountProduct } from '../../domain/accounts/account.ts'
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
  try {
    const account = await setup.repository.create(input, setup.key)
    return c.json(account, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'account number already exists' }, 409)
    }
    throw error
  }
}

export async function updateAccount(c: AppContext, id: string, input: AccountUpdate): Promise<Response> {
  if (!c.env.DB) return c.json(CONFIG_ERROR, 503)
  const account = await createAccountRepository(c.env.DB).update(id, input)
  if (!account) return c.json({ error: 'account not found' }, 404)
  return c.json(account)
}

export async function deleteAccount(c: AppContext, id: string): Promise<Response> {
  if (!c.env.DB) return c.json(CONFIG_ERROR, 503)
  const removed = await createAccountRepository(c.env.DB).remove(id)
  if (!removed) return c.json({ error: 'account not found' }, 404)
  return c.body(null, 204)
}

export async function setAccountProduct(c: AppContext, id: string, code: string, input: AccountProduct): Promise<Response> {
  if (!c.env.DB) return c.json(CONFIG_ERROR, 503)
  const account = await createAccountRepository(c.env.DB).setProduct(id, code, input.enabled)
  if (!account) return c.json({ error: 'account not found' }, 404)
  return c.json(account)
}
