import { streamSSE } from 'hono/streaming'
import type { Context } from 'hono'
import { createAccountRepository } from '../accounts/account-repository.ts'
import { kisClientFromEnv } from './kis-context.ts'

type AppContext = Context<{ Bindings: Env }>

export function kisStatusStream(c: AppContext, deps: { sleep?: (ms: number) => Promise<void>; now?: () => number; interval?: number; maxDuration?: number; fetchFn?: typeof fetch } = {}) {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  const now = deps.now ?? (() => Date.now())
  const interval = deps.interval ?? 25000
  const maxDuration = deps.maxDuration ?? 5 * 60 * 1000
  const fetchFn = deps.fetchFn ?? fetch
  const client = kisClientFromEnv(c, fetchFn)
  const db = c.env.DB
  if (!client || !db) return c.json({ error: 'kis token dependencies are not configured' }, 503)

  return streamSSE(c, async (stream) => {
    const start = now()
    const accounts = await createAccountRepository(db).list()
    const expires = new Map<string, number>()
    const emitStatus = async (accountId: string) => {
      const account = await client.forAccount(accountId)
      if (!account) return
      try {
        const { expiresAt } = await account.ensureToken()
        expires.set(accountId, expiresAt)
        await stream.writeSSE({ event: 'status', data: JSON.stringify({ accountId, status: 'connected', expiresAt }) })
      } catch {
        await stream.writeSSE({ event: 'status', data: JSON.stringify({ accountId, status: 'error' }) })
      }
    }

    for (const account of accounts) await emitStatus(account.id)
    while (now() - start < maxDuration) {
      await sleep(interval)
      if (now() - start >= maxDuration) break
      await stream.writeSSE({ event: 'ping', data: '' })
      for (const account of accounts) {
        const current = expires.get(account.id)
        if (current === undefined || now() > current - 10 * 60 * 1000) await emitStatus(account.id)
      }
    }
  })
}
