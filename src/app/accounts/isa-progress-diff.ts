import { isaK } from './isa-term'

export interface MonthTargetResult {
  k: number
  minTargetWon: number | null
  midTargetWon: number | null
  maxTargetWon: number | null
  minTargetManwon: number | null
  midTargetManwon: number | null
  maxTargetManwon: number | null
  minDiffText: string
  midDiffText: string
  maxDiffText: string
}

export function formatDiffManwon(diffWon: number | null, unitText: string, noTargetText: string): string {
  if (diffWon === null || !Number.isFinite(diffWon)) return noTargetText
  const man = Math.round(diffWon / 10_000)
  const sign = man > 0 ? '+' : ''
  return `${sign}${man.toLocaleString('ko-KR')}${unitText}`
}

export function calculateCurrentMonthTargets(
  startDate: string | undefined,
  today: string,
  minTargetWon: number | null,
  maxTargetWon: number | null,
  currentAssets: number | null,
  unitText: string,
  noTargetText: string,
  needStartDateText: string,
  beforeStartText: string,
): MonthTargetResult {
  const isFuture = Boolean(startDate && today && startDate > today)
  const k = startDate ? (isFuture ? 0 : isaK(startDate, today)) : 0

  const hasBoth = minTargetWon !== null && maxTargetWon !== null
  const minWon = minTargetWon !== null ? Math.round((minTargetWon * k) / 36) : null
  const maxWon = maxTargetWon !== null ? Math.round((maxTargetWon * k) / 36) : null
  const midWon = hasBoth && minWon !== null && maxWon !== null ? Math.round((minWon + maxWon) / 2) : null

  const getDiff = (targetWon: number | null, hasTarget: boolean) => {
    if (!hasTarget || targetWon === null) return noTargetText
    if (!startDate) return needStartDateText
    if (isFuture) return beforeStartText
    if (currentAssets === null || !Number.isFinite(currentAssets)) return noTargetText
    return formatDiffManwon(currentAssets - targetWon, unitText, noTargetText)
  }

  return {
    k,
    minTargetWon: startDate ? minWon : null,
    midTargetWon: startDate ? midWon : null,
    maxTargetWon: startDate ? maxWon : null,
    minTargetManwon: startDate && minWon !== null ? Math.round(minWon / 10_000) : null,
    midTargetManwon: startDate && midWon !== null ? Math.round(midWon / 10_000) : null,
    maxTargetManwon: startDate && maxWon !== null ? Math.round(maxWon / 10_000) : null,
    minDiffText: getDiff(minWon, minTargetWon !== null),
    midDiffText: getDiff(midWon, hasBoth),
    maxDiffText: getDiff(maxWon, maxTargetWon !== null),
  }
}
