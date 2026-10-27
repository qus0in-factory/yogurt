import type { Context } from 'hono'
import type { Holding } from '../../domain/kis/holdings-fallback'
import { portfolioProductCodeSchema } from '../../domain/portfolio/assignment'
import { kisBalanceHandler } from '../kis/kis-balance-handler'
import { listAssignments } from '../portfolio/assignment-repository'
import { getPortfolio } from '../portfolio/repository'
import { kisClientFromEnv } from '../kis/kis-context'
import { inquirePrice, QuoteError } from './price'
import { loadInputPrices } from './input-prices'
export async function rebalanceInputsHandler(c: Context<{ Bindings: Env }>, fetchFn: typeof fetch): Promise<Response> {
  const accountId = c.req.param('id')!
  const code = portfolioProductCodeSchema.safeParse(c.req.param('code'))
  if (!code.success) return c.json({ code: 'INVALID_PRODUCT_CODE' }, 400)
  if (!c.env.DB) return c.json({ code: 'REBALANCE_INPUTS_UNAVAILABLE' }, 503)
  try {
    const response = await kisBalanceHandler(c, fetchFn)
    if (!response.ok) return response
    const balance = await response.json() as { holdings: Holding[]; summary: { cash: number } }
    const assignment = (await listAssignments(c.env.DB)).find(a => a.accountId === accountId && a.productCode === code.data)
    const portfolio = assignment ? await getPortfolio(c.env.DB, assignment.portfolioId) : null
    const holdings = balance.holdings.map(({ code, name, quantity, currentPrice }) => ({ code, name, quantity, currentPrice: Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : 0 }))
    const targets = portfolio?.items.map(item => ({ code: item.stockCode, name: item.stockName, weightBps: item.targetWeightBps, kind: item.kind })) ?? []
    let client: ReturnType<NonNullable<ReturnType<typeof kisClientFromEnv>>['forAccount']> | undefined
    const prices = await loadInputPrices(holdings, targets, c.env.CACHE, async stockCode => {
      client ??= kisClientFromEnv(c, fetchFn)?.forAccount(accountId) ?? Promise.resolve(null)
      const account = await client
      if (!account) throw new QuoteError(503)
      return inquirePrice(account, stockCode)
    })
    return c.json({ ...prices, holdings, cash: balance.summary.cash, targets, hasPortfolio: portfolio !== null })
  } catch { return c.json({ code: 'REBALANCE_INPUTS_UNAVAILABLE' }, 503) }
}
