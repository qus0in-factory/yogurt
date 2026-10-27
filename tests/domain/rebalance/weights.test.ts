import { describe, expect, it } from 'vitest'
import { buildRebalancePlan } from '../../../src/domain/rebalance/plan'
import { cashTargetAmount, cashWeightPercent, currentWeightPercent, portfolioAmount, settledCash, targetWeightPercent } from '../../../src/domain/rebalance/weights'

describe('리밸런싱 비중 계산', () => {
  it('목표 비중은 bps/100이며 전체 금액·남길 금액과 무관하다', () => {
    expect(targetWeightPercent(2500)).toBe(25)
    expect(targetWeightPercent(3000)).toBe(30)
    expect(targetWeightPercent(undefined)).toBe(0)
  })
  it('포트폴리오 금액 = 전체 − 남길 금액, 음수면 0이다', () => {
    expect(portfolioAmount(20000, 4000)).toBe(16000)
    expect(portfolioAmount(20000, 0)).toBe(20000)
    expect(portfolioAmount(20000, 30000)).toBe(0)
  })
  it('현재 비중 분모는 포트폴리오 금액이다', () => {
    expect(currentWeightPercent(10, 1000, 16000)).toBe(62.5)
    expect(currentWeightPercent(10, 1000, 0)).toBe(0)
  })
  it('목표 현금은 포트폴리오 금액 × bps다(남길 금액 미포함)', () => {
    expect(cashTargetAmount(16000, 1000)).toBe(1600)
    expect(cashTargetAmount(0, 1000)).toBe(0)
    expect(cashTargetAmount(16000, undefined)).toBe(0)
  })
  it('정산 현금은 cashSettled만 쓰고 없으면 0이다', () => {
    expect(settledCash({ cash: 100, cashSettled: 70 })).toBe(70)
    expect(settledCash({ cash: 100, cashSettled: 0 })).toBe(0)
    expect(settledCash({ cash: 100 })).toBe(0)
    expect(settledCash({ cash: 100, cashSettled: null })).toBe(0)
  })
  it('예제: 전체 1000만(현금 300만·남길 200만)은 현금 행 100만·12.50%, 비중 합 100%', () => {
    const total = 10_000_000, keep = 2_000_000
    const base = portfolioAmount(total, keep)
    expect(base).toBe(8_000_000)
    const cashRow = Math.max(0, 3_000_000 - keep)
    expect(cashRow).toBe(1_000_000)
    expect(cashWeightPercent(cashRow, base)).toBe(12.5)
    const stockEval = 7_000_000
    expect(currentWeightPercent(700, 10000, base) + cashWeightPercent(cashRow, base)).toBe(100)
    expect(stockEval).toBe(base - cashRow)
  })
  it('plan과 대조: 행별 목표 금액 합 + 목표 현금 = 투자 가능 금액이다', () => {
    const prices: Record<string, number> = { A: 1000 }
    const plan = buildRebalancePlan({
      holdings: [], cash: 90000, keepAmount: 10000, prices,
      targets: [
        { kind: 'stock', code: 'A', name: '에이', weightBps: 9000 },
        { kind: 'cash', code: null, name: '현금/예수금', weightBps: 1000 },
      ],
    })
    const stockSum = plan.items.reduce((s, i) => s + i.targetQuantity * (prices[i.code] ?? 0), 0)
    expect(stockSum + cashTargetAmount(80000, 1000)).toBe(80000)
  })
})
