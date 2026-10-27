import { describe, expect, it } from 'vitest'
import { buildRebalancePlan } from '../../../src/domain/rebalance/plan'
import type { RebalanceInput } from '../../../src/domain/rebalance/types'

const h = (code: string, quantity: number, evaluationAmount: number) => ({ code, name: code, quantity, sellableQuantity: Math.ceil(quantity), evaluationAmount })
const t = (code: string, weightBps: number) => ({ kind: 'stock' as const, code, name: code, weightBps })
const cash = (weightBps: number) => ({ kind: 'cash' as const, code: null, name: '현금', weightBps })
const base = (input: Partial<RebalanceInput>): RebalanceInput => ({ holdings: [], cash: 0, keepAmount: 0, targets: [], prices: {}, ...input })
const stockTargets = [t('A', 3000), cash(7000)]

describe('buildRebalancePlan P=S-K', () => {
  it('예시 1: 목표 210주, 740주 매도, 최종 현금 7,900,000, K 매도 90', () => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 950, 9_500_000)], cash: 500_000, keepAmount: 3_000_000,
      targets: stockTargets, prices: { A: 10_000 },
    }))
    expect(plan.orders).toEqual([{ side: 'sell', code: 'A', name: 'A', quantity: 740, price: 10_000, estimatedAmount: 7_400_000 }])
    expect(plan.items).toEqual([
      { code: 'A', name: 'A', targetQuantity: 210, currentQuantity: 950, orderQuantity: 740, side: 'sell' },
    ])
    expect(plan.leftoverCash).toBe(7_900_000)
  })

  it('예시 2: 현금이 충분하면 10주 매수, 매도 없음, 최종 현금 7,900,000', () => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 200, 2_000_000)], cash: 8_000_000, keepAmount: 3_000_000,
      targets: stockTargets, prices: { A: 10_000 },
    }))
    expect(plan.orders).toEqual([{ side: 'buy', code: 'A', name: 'A', quantity: 10, price: 10_000, estimatedAmount: 100_000 }])
    expect(plan.items).toEqual([
      { code: 'A', name: 'A', targetQuantity: 210, currentQuantity: 200, orderQuantity: 10, side: 'buy' },
    ])
    expect(plan.leftoverCash).toBe(7_900_000)
  })

  it('예시 3: A 640주 매도·B 110주 매수, 최종 현금 5,800,000, K 매도 A 90·B 0', () => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 850, 8_500_000), h('B', 100, 1_000_000)], cash: 500_000, keepAmount: 3_000_000,
      targets: [t('A', 3000), t('B', 3000), cash(4000)], prices: { A: 10_000, B: 10_000 },
    }))
    expect(plan.orders).toEqual([
      { side: 'sell', code: 'A', name: 'A', quantity: 640, price: 10_000, estimatedAmount: 6_400_000 },
      { side: 'buy', code: 'B', name: 'B', quantity: 110, price: 10_000, estimatedAmount: 1_100_000 },
    ])
    expect(plan.items).toEqual([
      { code: 'A', name: 'A', targetQuantity: 210, currentQuantity: 850, orderQuantity: 640, side: 'sell' },
      { code: 'B', name: 'B', targetQuantity: 210, currentQuantity: 100, orderQuantity: 110, side: 'buy' },
    ])
    expect(plan.leftoverCash).toBe(5_800_000)
  })

  it.each([10_000_000, 12_000_000])('예시 4·5: K가 전체 이상이면 차단한다 (%s)', (keepAmount) => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 950, 9_500_000)], cash: 500_000, keepAmount, targets: stockTargets, prices: { A: 10_000 },
    }))
    expect(plan).toEqual({
      orders: [], items: [], leftoverCash: 0, warnings: [{ code: null, reason: 'KEEP_NOT_BELOW_TOTAL' }],
    })
  })
})
