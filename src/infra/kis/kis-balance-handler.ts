import type { Context } from 'hono'
import { productCodeSchema } from '../../domain/accounts/products.ts'
import { seoulDateTime } from '../../domain/accounts/snapshot-month.ts'
import { resolveCash } from '../../domain/kis/cash-fallback.ts'
import { activeHoldings, resolveHoldings } from '../../domain/kis/holdings-fallback.ts'
import { writeHoldingStockNames } from '../stocks/stock-name-store.ts'
import { readCashLast, writeCashLast } from './cash-last-store.ts'
import { readHoldingsLast, writeHoldingsLast } from './holdings-last-store.ts'
import { kisClientFromEnv } from './kis-context.ts'
import { KisApiError, fetchStockBalance, type KisAccountClient } from './kis-stock-balance.ts'

type AppContext = Context<{ Bindings: Env }>

export function kisBalanceHandler(c: AppContext, fetchFn: typeof fetch = fetch): Promise<Response> {
  return kisQueryHandler(c, fetchFn, async (account, code) => {
    const balance = await fetchStockBalance(account, code)
    const cache = c.env.CACHE
    if (!cache) return { ...balance, holdings: activeHoldings(balance.holdings) }
    const accountId = c.req.param('id') as string
    const observed = balance.summary.cash
    const current = Number.isSafeInteger(observed) && observed > 0
    const now = new Date()
    const asOf = seoulDateTime(now)
    const cachedCash = current ? null : await readCashLast(cache, accountId, code, now)
    const resolved = resolveCash(observed, cachedCash, asOf)
    if (current) {
      await writeCashLast(cache, accountId, code, { cashWon: observed, asOf, source: 'kis' })
    }
    const stockValue = Math.max(balance.summary.stockEvaluation, balance.summary.evaluationAmount)
    const missing = activeHoldings(balance.holdings).length === 0 && stockValue > 0
    const cachedHoldings = missing ? await readHoldingsLast(cache, accountId, code, now) : null
    const resolvedHoldings = resolveHoldings(balance.holdings, stockValue, cachedHoldings, asOf)
    if (resolvedHoldings.holdingsSource === 'kis' && resolvedHoldings.holdings.length > 0 && !resolvedHoldings.holdingsPartialWarning && stockValue > 0) {
      await writeHoldingsLast(cache, accountId, code, {
        holdings: resolvedHoldings.holdings, stockEvaluationWon: stockValue, asOf,
      })
    }
    if (resolvedHoldings.holdingsSource === 'kis') {
      await writeHoldingStockNames(cache, resolvedHoldings.holdings, asOf)
    }
    return { ...balance, ...resolvedHoldings, summary: { ...balance.summary, ...resolved } }
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
