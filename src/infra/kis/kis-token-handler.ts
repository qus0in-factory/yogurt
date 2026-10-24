import type { Context } from 'hono'
import { isValidEncryptionKey } from '../accounts/account-crypto.ts'
import { createAccountRepository } from '../accounts/account-repository.ts'
import { getKisToken } from './kis-token.ts'

type AppContext = Context<{ Bindings: Env }>

function configured(c: AppContext) {
  const key = c.env.ACCOUNT_ENCRYPTION_KEY
  if (!c.env.DB || !key || !isValidEncryptionKey(key) || !c.env.CACHE) return null
  return { repository: createAccountRepository(c.env.DB), key, cache: c.env.CACHE }
}

export async function kisTokenHandler(c: AppContext, fetchFn: typeof fetch = fetch): Promise<Response> {
  const setup = configured(c)
  if (!setup) return c.json({ error: 'kis token dependencies are not configured' }, 503)
  const creds = await setup.repository.findCredentials(c.req.param('id') as string, setup.key)
  if (!creds) return c.json({ error: 'account not found' }, 404)
  try {
    const result = await getKisToken(setup.cache, c.req.param('id') as string, creds, fetchFn)
    return c.json({ issued: result.issued, expiresAt: result.expiresAt }, 200)
  } catch {
    return c.json({ error: 'kis token failed' }, 502)
  }
}
