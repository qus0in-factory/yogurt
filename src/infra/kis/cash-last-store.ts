import { isCashFresh, parseCachedCash, type CachedCash } from '../../domain/kis/cash-fallback.ts'

const PREFIX = 'cash-last:'
const EXPIRATION_TTL_SECONDS = 604800

export function cashLastKey(accountId: string, productCode: string): string {
  return `${PREFIX}${accountId}:${productCode}`
}

export async function readCashLast(
  cache: KVNamespace,
  accountId: string,
  productCode: string,
  now: Date,
): Promise<CachedCash | null> {
  try {
    const raw = await cache.get(cashLastKey(accountId, productCode))
    if (!raw) return null
    const stored = parseCachedCash(raw)
    return stored && isCashFresh(stored.asOf, now) ? stored : null
  } catch {
    return null
  }
}

export async function writeCashLast(
  cache: KVNamespace,
  accountId: string,
  productCode: string,
  value: CachedCash,
): Promise<void> {
  if (!Number.isSafeInteger(value.cashWon) || value.cashWon <= 0) return
  try {
    await cache.put(cashLastKey(accountId, productCode), JSON.stringify(value), {
      expirationTtl: EXPIRATION_TTL_SECONDS,
    })
  } catch {
    // A cache failure must not fail a successful KIS response.
  }
}
