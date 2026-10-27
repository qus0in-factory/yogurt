import { describe, expect, it } from 'vitest'
import { buildRebalancePlan } from '../../../src/domain/rebalance/plan.ts'
import type { RebalanceInput } from '../../../src/domain/rebalance/types.ts'

const input = (target: number, held: number, mode: RebalanceInput['mode'] = 'diff'): RebalanceInput => ({
  holdings: [{ code: 'A', name: 'A', quantity: held, sellableQuantity: Math.ceil(held), evaluationAmount: 0 }],
  cash: target * 100, keepAmount: 0, prices: { A: 100 },
  targets: [{ kind: 'stock', code: 'A', name: 'A', weightBps: 10000 }], mode,
})

describe('매수 내림·매도 올림 리밸런싱', () => {
  it.each([
    [10.3, 8, 'buy', 2], [10.9, 8, 'buy', 2],
    [7.2, 10, 'sell', 3], [7.0, 10, 'sell', 3],
    [0.4, 1, 'sell', 1],
  ] as const)('목표 %s / 보유 %s → %s %s주, 정수 수량 관계 유지', (target, held, side, quantity) => {
    const plan = buildRebalancePlan(input(target, held))
    expect(plan.orders).toMatchObject([{ side, quantity }])
    const signed = side === 'buy' ? quantity : -quantity
    expect(plan.items[0]).toMatchObject({
      targetQuantity: held + signed, currentQuantity: held, orderQuantity: quantity, side,
    })
    expect(Number.isInteger(plan.items[0].targetQuantity)).toBe(true)
    expect(Number.isInteger(plan.items[0].orderQuantity)).toBe(true)
  })
  it('매수 내림 결과가 0이면 변경 없음', () => {
    const plan = buildRebalancePlan(input(8.9, 8))
    expect(plan.orders).toEqual([])
    expect(plan.items[0]).toMatchObject({ targetQuantity: 8, orderQuantity: 0, side: 'none' })
  })
  it.each([
    [10.3, 8.5, 'buy', 1], [7.2, 10.5, 'sell', 4], [0.1, 0.5, 'sell', 0.5],
  ] as const)('소수 보유에서도 차액을 반올림하고 보유 한도 적용: %s / %s', (target, held, side, quantity) => {
    const plan = buildRebalancePlan(input(target, held))
    expect(plan.orders).toMatchObject([{ side, quantity }])
    expect(plan.items[0].targetQuantity).toBe(held + (side === 'buy' ? quantity : -quantity))
  })
  it('방식 A는 보유 전량 매도 후 floor(목표)를 재매수한다', () => {
    const plan = buildRebalancePlan(input(10.9, 8, 'full'))
    expect(plan.orders).toMatchObject([{ side: 'sell', quantity: 8 }, { side: 'buy', quantity: 10 }])
    expect(plan.items[0]).toMatchObject({ targetQuantity: 10, currentQuantity: 8, orderQuantity: 2, side: 'buy' })
  })
  it('목표에 없는 종목은 보유 전량 매도한다', () => {
    const data = input(10.3, 8)
    data.targets = []
    const plan = buildRebalancePlan(data)
    expect(plan.orders).toMatchObject([{ side: 'sell', quantity: 8 }])
    expect(plan.items[0]).toMatchObject({ targetQuantity: 0, currentQuantity: 8, orderQuantity: 8 })
  })
})
