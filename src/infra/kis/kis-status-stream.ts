import { streamSSE } from 'hono/streaming'
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

export function kisStatusStream(c: AppContext, deps: { sleep?: (ms: number) => Promise<void>; now?: () => number; interval?: number; maxDuration?: number; fetchFn?: typeof fetch } = {}) {
  const setup = configured(c)
  if (!setup) return c.json({ error: 'kis token dependencies are not configured' }, 503)
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  const now = deps.now ?? (() => Date.now())
  const interval = deps.interval ?? 25000
  const maxDuration = deps.maxDuration ?? 5 * 60 * 1000
  const fetchFn = deps.fetchFn ?? fetch

  return streamSSE(c, async (stream) => {
    const start = now()
    const accounts = await setup.repository.list()
    const expires = new Map<string, number>()
    for (const account of accounts) {
      const creds = await setup.repository.findCredentials(account.id, setup.key)
      if (!creds) continue
      try {
        const result = await getKisToken(setup.cache, account.id, creds, fetchFn, now())
        expires.set(account.id, result.expiresAt)
        await stream.writeSSE({ event: 'status', data: JSON.stringify({ accountId: account.id, status: 'connected', expiresAt: result.expiresAt }) })
      } catch {
        await stream.writeSSE({ event: 'status', data: JSON.stringify({ accountId: account.id, status: 'error' }) })
      }
    }
    while (now() - start < maxDuration) {
      await sleep(interval)
      if (now() - start >= maxDuration) break
      await stream.writeSSE({ event: 'ping', data: '' })
      for (const account of accounts) {
        const currentExpires = expires.get(account.id)
        if (currentExpires === undefined || now() > currentExpires - 10 * 60 * 1000) {
          const creds = await setup.repository.findCredentials(account.id, setup.key)
          if (!creds) continue
          try {
            const result = await getKisToken(setup.cache, account.id, creds, fetchFn, now())
            expires.set(account.id, result.expiresAt)
            await stream.writeSSE({ event: 'status', data: JSON.stringify({ accountId: account.id, status: 'connected', expiresAt: result.expiresAt }) })
          } catch {
            await stream.writeSSE({ event: 'status', data: JSON.stringify({ accountId: account.id, status: 'error' }) })
          }
        }
      }
    }
  })
}
