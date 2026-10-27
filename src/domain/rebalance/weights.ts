import { percentOfRounded } from '../shared/numbers.ts'

// 목표 비중(%) = bps / 100. 남길 금액·전체 금액과 무관하게 포트폴리오 내 비중이다.
export function targetWeightPercent(weightBps: number | undefined): number {
  return (weightBps ?? 0) / 100
}

// 포트폴리오 금액 = 전체 − 남길 금액. 남길 금액은 포트폴리오 밖이다. 음수면 0.
export function portfolioAmount(total: number, keepAmount = 0): number {
  return Math.max(0, total - keepAmount)
}

// 현재 비중(%) = 평가액(수량×현재가) / 포트폴리오 금액 × 100. 0 이하면 0.
export function currentWeightPercent(quantity: number, price: number | undefined, weightBase: number): number {
  if (!Number.isFinite(quantity) || weightBase <= 0) return 0
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return 0
  return percentOfRounded(quantity * price, weightBase)
}

// 정산 기준 현금은 D+2만 쓴다. 없으면 0을 반환하며 D+0 cash로 대체하지 않는다.
export function settledCash(source: { cash: number; cashSettled?: number | null }): number {
  const v = source.cashSettled
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

// 현금 현재 비중(%) = 정산 현금 / 포트폴리오 금액 × 100.
export function cashWeightPercent(cashAmount: number, weightBase: number): number {
  if (weightBase <= 0) return 0
  return percentOfRounded(cashAmount, weightBase)
}

// 목표 현금(원) = 포트폴리오 금액 × 현금 bps/10000. 남길 금액은 포함하지 않는다.
export function cashTargetAmount(weightBase: number, cashBps?: number): number {
  if (weightBase <= 0) return 0
  return (weightBase * (cashBps ?? 0)) / 10000
}
