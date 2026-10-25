import { isHoldingsFresh, parseStoredHoldings, type StoredHoldings } from '../../domain/kis/holdings-fallback.ts'

const PREFIX = 'holdings-last:'
const EXPIRATION_TTL_SECONDS = 604800

export function holdingsLastKey(accountId: string, productCode: string): string {
  return `${PREFIX}${accountId}:${productCode}`
}

export async function readHoldingsLast(
  cache: KVNamespace,
  accountId: string,
  productCode: string,
  now: Date,
): Promise<StoredHoldings | null> {
  try {
    const raw = await cache.get(holdingsLastKey(accountId, productCode))
    if (!raw) return null
    const stored = parseStoredHoldings(raw)
    return stored && isHoldingsFresh(stored.asOf, now) ? stored : null
  } catch {
    return null
  }
}

export async function writeHoldingsLast(
  cache: KVNamespace,
  accountId: string,
  productCode: string,
  value: StoredHoldings,
): Promise<void> {
  if (value.holdings.length === 0) return
  try {
    await cache.put(holdingsLastKey(accountId, productCode), JSON.stringify(value), {
      expirationTtl: EXPIRATION_TTL_SECONDS,
    })
  } catch {
    // A cache failure must not fail a successful KIS response.
  }
}
