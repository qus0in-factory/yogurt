import { cachedQuote } from './cache'
import type { Quote } from './price'
type Holding = { code: string; currentPrice?: number }
type Target = { code: string | null; kind: string }
export async function loadInputPrices(
  holdings: Holding[], targets: Target[], cache: KVNamespace | undefined,
  lookup: (code: string) => Promise<Quote>,
) {
  const prices = new Map<string, number>()
  for (const holding of holdings) {
    if (Number.isFinite(holding.currentPrice) && holding.currentPrice! > 0) {
      prices.set(holding.code, holding.currentPrice!)
    }
  }
  const codes = new Set(holdings.map(holding => holding.code))
  for (const target of targets) {
    if (target.kind === 'security' && target.code) codes.add(target.code)
  }
  const missing = [...codes].filter(code => !prices.has(code))
  const results = await Promise.allSettled(missing.map(code => cachedQuote(cache, code, () => lookup(code))))
  const priceFailed: string[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') prices.set(missing[index], result.value.price)
    else priceFailed.push(missing[index])
  })
  return { prices: Object.fromEntries(prices), priceFailed }
}
