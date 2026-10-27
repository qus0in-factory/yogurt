export type CashSource = 'kis' | 'user'

export type CachedCash = {
  cashWon: number
  cashD2Won?: number
  asOf: string
  source: CashSource
}

export type CashResolution = {
  cash: number
  cashSource: CashSource | null
  cashAsOf: string | null
  cashFallback: boolean
  cashUnavailable: boolean
}

const AS_OF = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
const WEEK_MS = 7 * 86400000

export function isCashFresh(asOf: string, now: Date): boolean {
  const saved = Date.parse(`${asOf.replace(' ', 'T')}:00+09:00`)
  if (!Number.isFinite(saved)) return false
  const age = now.getTime() - saved
  return age >= 0 && age <= WEEK_MS
}

export function parseCachedCash(raw: string): CachedCash | null {
  try {
    const value = JSON.parse(raw) as Partial<CachedCash>
    if (
      typeof value.cashWon === 'number' && Number.isSafeInteger(value.cashWon) && value.cashWon > 0
      && typeof value.asOf === 'string' && AS_OF.test(value.asOf)
      && (value.source === 'kis' || value.source === 'user')
    ) {
      const cashD2 = typeof value.cashD2Won === 'number' && Number.isSafeInteger(value.cashD2Won) && value.cashD2Won > 0
        ? value.cashD2Won : undefined
      return { cashWon: value.cashWon, ...(cashD2 === undefined ? {} : { cashD2Won: cashD2 }), asOf: value.asOf, source: value.source }
    }
  } catch {
    return null
  }
  return null
}

export function resolveCash(
  observed: number,
  cached: CachedCash | null,
  observedAsOf: string,
): CashResolution {
  if (Number.isSafeInteger(observed) && observed > 0) {
    return { cash: observed, cashSource: 'kis', cashAsOf: observedAsOf, cashFallback: false, cashUnavailable: false }
  }
  if (cached) {
    return { cash: cached.cashWon, cashSource: cached.source, cashAsOf: cached.asOf, cashFallback: true, cashUnavailable: false }
  }
  return { cash: 0, cashSource: null, cashAsOf: null, cashFallback: false, cashUnavailable: true }
}
