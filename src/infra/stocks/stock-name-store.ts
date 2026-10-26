const PREFIX = 'stock-name:'
export const STOCK_NAME_TTL_SECONDS = 2592000

export type StoredStockName = {
  name: string
  asOf: string
}

export function stockNameKey(code: string): string {
  return `${PREFIX}${code}`
}

function parseStoredStockName(raw: string): StoredStockName | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const name = typeof parsed?.name === 'string' ? parsed.name.trim() : ''
    const asOf = typeof parsed?.asOf === 'string' ? parsed.asOf.trim() : ''
    if (!name || !asOf) return null
    return { name, asOf }
  } catch {
    return null
  }
}

export async function readStockName(
  cache: KVNamespace,
  code: string,
): Promise<StoredStockName | null> {
  try {
    const raw = await cache.get(stockNameKey(code))
    if (!raw) return null
    return parseStoredStockName(raw)
  } catch {
    return null
  }
}

export async function writeStockName(
  cache: KVNamespace,
  code: string,
  value: StoredStockName,
): Promise<void> {
  if (!value.name.trim()) return
  try {
    await cache.put(stockNameKey(code), JSON.stringify(value), {
      expirationTtl: STOCK_NAME_TTL_SECONDS,
    })
  } catch {
    // A cache failure must not fail a successful KIS response.
  }
}
