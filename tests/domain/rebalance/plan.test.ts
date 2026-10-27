import { describe, expect, it } from 'vitest'
import { buildRebalancePlan } from '../../../src/domain/rebalance/plan'
import type { RebalanceInput } from '../../../src/domain/rebalance/types'

const h = (code: string, quantity: number, evaluationAmount: number) => ({ code, name: code, quantity, evaluationAmount })
const t = (code: string, weightBps: number) => ({ kind: 'stock' as const, code, name: code, weightBps })
const cash = (weightBps: number) => ({ kind: 'cash' as const, code: null, name: '현금', weightBps })
const base = (input: Partial<RebalanceInput>): RebalanceInput => ({ holdings: [], cash: 0, keepAmount: 0, targets: [], prices: {}, ...input })
const shape = (input: RebalanceInput) => buildRebalancePlan(input).orders.map((order) => [order.side, order.code, order.quantity])

describe('buildRebalancePlan', () => {
  it('투자 가능 금액과 목표 수량을 내림하고, 남길 돈이 크면 0+경고', () => {
    const input = base({ holdings: [h('A', 10, 1_000_000)], cash: 500_000, keepAmount: 200_000, targets: [t('A', 5000)], prices: { A: 90_000 } })
    const plan = buildRebalancePlan(input)
    expect(plan.orders).toEqual([{ side: 'sell', code: 'A', name: 'A', quantity: 3, price: 90_000, estimatedAmount: 270_000 }])
    expect(plan.leftoverCash).toBe(1_570_000)
    expect(buildRebalancePlan({ ...input, keepAmount: 2_000_000 })).toEqual({
      orders: [], items: [], leftoverCash: 0, warnings: [{ code: null, reason: 'NOT_INVESTABLE' }],
    })
  })

  it('방식 B는 목표 밖 전량 매도, 목표 종목은 수량 차액만 매수·매도한다', () => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 10, 1_000_000), h('B', 5, 500_000), h('C', 2, 200_000)],
      cash: 100_000, targets: [t('A', 4000), t('B', 4000), cash(2000)],
      prices: { A: 100_000, B: 100_000, C: 100_000 },
    }))
    expect(plan.orders.map((order) => [order.side, order.code, order.quantity])).toEqual([
      ['sell', 'C', 2], ['sell', 'A', 3], ['buy', 'B', 2],
    ])
    expect(plan.items).toEqual([
      { code: 'A', name: 'A', targetQuantity: 7, currentQuantity: 10, orderQuantity: 3, side: 'sell' },
      { code: 'B', name: 'B', targetQuantity: 7, currentQuantity: 5, orderQuantity: 2, side: 'buy' },
      { code: 'C', name: 'C', targetQuantity: 0, currentQuantity: 2, orderQuantity: 2, side: 'sell' },
    ])
    for (const item of plan.items) {
      const signed = item.side === 'buy' ? item.orderQuantity : item.side === 'sell' ? -item.orderQuantity : 0
      expect(item.currentQuantity + signed).toBe(item.targetQuantity)
      expect(Number.isInteger(item.targetQuantity) && Number.isInteger(item.orderQuantity)).toBe(true)
    }
    expect(plan.leftoverCash).toBe(2_100_000)
  })

  it('차액 0 항목은 items 에 남고 orders 에서 제외한다', () => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 7, 700_000)], targets: [t('A', 10000)], prices: { A: 100_000 },
    }))
    expect(plan.orders).toEqual([])
    expect(plan.items).toEqual([
      { code: 'A', name: 'A', targetQuantity: 7, currentQuantity: 7, orderQuantity: 0, side: 'none' },
    ])
  })

  it('방식 A는 보유 전량 매도 후 목표 수량 매수한다', () => {
    expect(shape(base({
      holdings: [h('A', 10, 1_000_000), h('C', 2, 200_000)], cash: 100_000, mode: 'full',
      targets: [t('A', 5000), t('B', 5000)], prices: { A: 100_000, B: 100_000, C: 100_000 },
    }))).toEqual([['sell', 'C', 2], ['sell', 'A', 10], ['buy', 'A', 6], ['buy', 'B', 6]])
  })

  it('현금 목표는 주문하지 않고, 가격 없는 종목은 제외·경고하며 매도가 매수보다 앞선다', () => {
    const plan = buildRebalancePlan(base({
      holdings: [h('A', 10, 1_000_000), h('B', 5, 500_000), h('C', 1, 100_000)],
      targets: [t('A', 4000), t('B', 1000), t('D', 3000), t('E', 1000), cash(1000)],
      prices: { A: 100_000, B: 100_000, D: 80_000 },
    }))
    expect(plan.orders.map((order) => [order.side, order.code, order.quantity])).toEqual([
      ['sell', 'A', 4], ['sell', 'B', 4], ['buy', 'D', 6],
    ])
    expect(plan.warnings).toEqual([{ code: 'C', reason: 'NO_PRICE' }, { code: 'E', reason: 'NO_PRICE' }])
    expect(plan.leftoverCash).toBe(1_920_000)
  })
})
