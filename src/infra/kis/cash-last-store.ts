import { parseCachedCash, type CachedCash } from '../../domain/kis/cash-fallback.ts'

const PREFIX = 'cash-last:'

export function cashLastKey(accountId: string, productCode: string): string {
  return `${PREFIX}${accountId}:${productCode}`
}

export async function readCashLast(cache: KVNamespace, accountId: string, productCode: string): Promise<CachedCash | null> {
  try {
    const raw = await cache.get(cashLastKey(accountId, productCode))
    return raw ? parseCachedCash(raw) : null
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
    await cache.put(cashLastKey(accountId, productCode), JSON.stringify(value))
  } catch {
    // A cache failure must not fail a successful KIS response.
  }
}
