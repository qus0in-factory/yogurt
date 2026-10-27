import type { Quote } from './price'
export const QUOTE_TTL = 60
export async function cachedQuote(cache: KVNamespace | undefined, code: string, load: () => Promise<Quote>): Promise<Quote> {
  const key = `quote:${code}`
  try {
    const text = await cache?.get(key)
    const value = text ? JSON.parse(text) as Quote : null
    const age = value ? Date.now() - Date.parse(value.asOf) : Infinity
    if (value?.code === code && Number.isSafeInteger(value.price) && value.price > 0 && age >= 0 && age < QUOTE_TTL * 1000) return value
  } catch { /* Cache outages are misses. */ }
  const quote = await load()
  try { await cache?.put(key, JSON.stringify(quote), { expirationTtl: QUOTE_TTL }) }
  catch { /* A successful price remains usable when KV is unavailable. */ }
  return quote
}
