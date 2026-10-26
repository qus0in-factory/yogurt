import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item.ts'

const PREFIX = 'stock-name:'
const MAX_STOCK_NAME_LENGTH = 80
export const STOCK_NAME_TTL_SECONDS = 604800

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
  const name = value.name.trim().slice(0, MAX_STOCK_NAME_LENGTH)
  if (!name) return
  try {
    await cache.put(stockNameKey(code), JSON.stringify({ name, asOf: value.asOf }), {
      expirationTtl: STOCK_NAME_TTL_SECONDS,
    })
  } catch {
    // A cache failure must not fail a successful KIS response.
  }
}

export async function writeHoldingStockNames(
  cache: KVNamespace,
  holdings: ReadonlyArray<{ code: string; name: string }>,
  asOf: string,
): Promise<void> {
  for (const holding of holdings) {
    const code = holding.code.trim().toUpperCase()
    const name = holding.name.trim().slice(0, MAX_STOCK_NAME_LENGTH)
    if (!STOCK_CODE_PATTERN.test(code) || !name) continue
    const existing = await readStockName(cache, code)
    if (existing?.name === name) continue
    await writeStockName(cache, code, { name, asOf })
  }
}
