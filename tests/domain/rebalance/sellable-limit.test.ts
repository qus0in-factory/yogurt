import { expect, it } from 'vitest'
import { buildRebalancePlan } from '../../../src/domain/rebalance/plan'
const input = (sellableQuantity?: number) => ({
  holdings: [{ code: 'A', name: 'A', quantity: 10, evaluationAmount: 1000, sellableQuantity }],
  cash: 100, keepAmount: 0,
  targets: [{ kind: 'cash' as const, code: null, name: '현금', weightBps: 10000 }],
  prices: { A: 100 },
})

it('매도 가능 수량 3으로 계획을 제한한다', () => {
  const plan = buildRebalancePlan(input(3))
  expect(plan.items[0].orderQuantity).toBe(3)
  expect(plan.items[0].sellableWarning).toBeUndefined()
  expect(plan.orders.filter((o) => o.side === 'sell').reduce((n, o) => n + o.quantity, 0)).toBe(3)
})

it('매도 가능 수량 필드가 없으면 NO_SELLABLE 경고와 missing 표시로 매도를 막는다', () => {
  const plan = buildRebalancePlan(input())
  expect(plan.items[0]).toMatchObject({ orderQuantity: 0, side: 'none', sellableWarning: 'missing' })
  expect(plan.warnings).toContainEqual({ code: 'A', reason: 'NO_SELLABLE', sellableQuantity: null })
  expect(plan.orders.filter((o) => o.side === 'sell')).toHaveLength(0)
})

it('매도 가능 수량이 실제 0이면 zero 표시로 매도를 막는다', () => {
  const plan = buildRebalancePlan(input(0))
  expect(plan.items[0]).toMatchObject({ orderQuantity: 0, side: 'none', sellableWarning: 'zero' })
  expect(plan.warnings).toContainEqual({ code: 'A', reason: 'NO_SELLABLE', sellableQuantity: 0 })
})
