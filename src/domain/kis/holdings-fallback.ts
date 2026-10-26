import { type Holding, type StoredHoldings } from './holdings-snapshot.ts'

export { isHoldingsFresh, parseStoredHoldings } from './holdings-snapshot.ts'
export type { Holding, StoredHoldings } from './holdings-snapshot.ts'

export type HoldingsResolution = {
  holdings: Holding[]
  holdingsSource: 'kis' | 'kv' | null
  holdingsAsOf: string | null
  holdingsFallback: boolean
  holdingsUnavailable: boolean
  holdingsPartialWarning: boolean
}

export function activeHoldings(holdings: Holding[]): Holding[] {
  return holdings.filter((holding) => holding.quantity > 0)
}

function partialWarning(holdings: Holding[], stockValue: number): boolean {
  const sum = holdings.reduce((total, holding) => total + holding.evaluationAmount, 0)
  if (stockValue <= 0) return false
  return Math.abs(sum - stockValue) / stockValue >= 0.05
}

export function resolveHoldings(
  observed: Holding[],
  stockValue: number,
  cached: StoredHoldings | null,
  observedAsOf: string,
): HoldingsResolution {
  const active = activeHoldings(observed)
  if (active.length > 0) {
    return {
      holdings: active, holdingsSource: 'kis', holdingsAsOf: observedAsOf,
      holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: partialWarning(active, stockValue),
    }
  }
  if (stockValue <= 0) {
    return {
      holdings: [], holdingsSource: 'kis', holdingsAsOf: observedAsOf,
      holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: false,
    }
  }
  if (cached) {
    const cachedHoldings = activeHoldings(cached.holdings)
    return {
      holdings: cachedHoldings, holdingsSource: 'kv', holdingsAsOf: cached.asOf,
      holdingsFallback: true, holdingsUnavailable: false,
      holdingsPartialWarning: partialWarning(cachedHoldings, stockValue),
    }
  }
  return {
    holdings: [], holdingsSource: null, holdingsAsOf: null,
    holdingsFallback: false, holdingsUnavailable: true, holdingsPartialWarning: false,
  }
}
