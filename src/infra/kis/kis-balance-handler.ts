import type { Context } from 'hono'
import { productCodeSchema } from '../../domain/accounts/products.ts'
import { seoulDateTime } from '../../domain/accounts/snapshot-month.ts'
import { resolveCash } from '../../domain/kis/cash-fallback.ts'
import { readCashLast, writeCashLast } from './cash-last-store.ts'
import { kisClientFromEnv } from './kis-context.ts'
import { KisApiError, fetchStockBalance, type KisAccountClient } from './kis-stock-balance.ts'

type AppContext = Context<{ Bindings: Env }>

export function kisBalanceHandler(c: AppContext, fetchFn: typeof fetch = fetch): Promise<Response> {
  return kisQueryHandler(c, fetchFn, async (account, code) => {
    const balance = await fetchStockBalance(account, code)
    const cache = c.env.CACHE
    if (!cache) return balance
    const accountId = c.req.param('id') as string
    const observed = balance.summary.cash
    const current = Number.isSafeInteger(observed) && observed > 0
    const cached = current ? null : await readCashLast(cache, accountId, code)
    const asOf = seoulDateTime(new Date())
    const resolved = resolveCash(observed, cached, asOf)
    if (current) {
      await writeCashLast(cache, accountId, code, { cashWon: observed, asOf, source: 'kis' })
    }
    return { ...balance, summary: { ...balance.summary, ...resolved } }
  })
}

export async function kisQueryHandler<T extends object>(
  c: AppContext, fetchFn: typeof fetch,
  load: (account: KisAccountClient, productCode: string) => Promise<T>,
): Promise<Response> {
  const code = productCodeSchema.safeParse(c.req.param('code'))
  if (!code.success) return c.json({ error: 'invalid product code' }, 400)
  const client = kisClientFromEnv(c, fetchFn)
  if (!client) return c.json({ error: 'kis balance dependencies are not configured' }, 503)
  const account = await client.forAccount(c.req.param('id') as string)
  if (!account) return c.json({ error: 'account not found' }, 404)
  try {
    return c.json(await load(account, code.data), 200)
  } catch (error) {
    const codeFailed = error instanceof KisApiError ? error.code : undefined
    return c.json({ error: 'kis request failed', ...(codeFailed ? { code: codeFailed } : {}) }, 502)
  }
}
