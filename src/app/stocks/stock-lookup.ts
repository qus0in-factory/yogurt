import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item'

export type StockLookupResult =
  | { status: 'success'; code: string; name: string }
  | { status: 'not_found' }
  | { status: 'unavailable' }

export async function lookupStockName(code: string): Promise<StockLookupResult> {
  const normalized = code.trim().toUpperCase()
  if (!STOCK_CODE_PATTERN.test(normalized)) {
    return { status: 'not_found' }
  }
  try {
    const res = await fetch(`/api/stocks/${encodeURIComponent(normalized)}`)
    if (res.status === 200) {
      const data = (await res.json()) as { code: string; name: string }
      return { status: 'success', code: data.code, name: data.name }
    }
    if (res.status === 404) {
      return { status: 'not_found' }
    }
    return { status: 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}
