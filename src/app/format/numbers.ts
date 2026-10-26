import { roundWonToManwon } from '../../domain/shared/money'

const numberFormatter = new Intl.NumberFormat('ko-KR')
const percentUpTo2Formatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
})
const percentFixed2Formatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatPercentUpTo2(value: number): string {
  return `${percentUpTo2Formatter.format(value)}%`
}

export function formatPercentFixed2(value: number): string {
  return `${percentFixed2Formatter.format(value)}%`
}

export function formatIsaPercent(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const rounded = Math.round(Math.abs(value) * 10) / 10
  const sign = value < 0 && rounded !== 0 ? '-' : ''
  return `${sign}${rounded.toFixed(1)}%`
}

export function formatDiffManwon(
  diffWon: number | null,
  unitText: string,
  noTargetText: string,
): string {
  if (diffWon === null || !Number.isFinite(diffWon)) return noTargetText
  const manwon = roundWonToManwon(diffWon)
  const sign = manwon > 0 ? '+' : ''
  return `${sign}${formatNumber(manwon)}${unitText}`
}
