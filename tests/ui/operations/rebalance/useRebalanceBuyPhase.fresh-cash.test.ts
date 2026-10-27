import { renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useRebalanceBuyPhase } from '../../../../src/ui/operations/rebalance/useRebalanceBuyPhase'
import type { RebalancePlan } from '../../../../src/domain/rebalance/types'

const plan: RebalancePlan = { orders: [], leftoverCash: 0, warnings: [], items: [{ code: 'A', name: 'A', side: 'sell', orderQuantity: 10, currentQuantity: 10, targetQuantity: 0 }] }
const base = { targetKey: 'a:01', plan, calculatedAt: new Date(500).toISOString(), sellEvents: [{ pair: 'A:sell', status: 'closed_partial' as const, at: 1000 }], isFetching: false, cashSettled: 1000000, keepAmount: 300000, refresh: vi.fn() }
it('종료 후 성공한 새 현금만 게이트를 열고 한도로 사용한다', () => {
  const { result, rerender } = renderHook(({ stamp, error, cash }) => useRebalanceBuyPhase({ ...base, cashUpdatedAt: stamp, isCashError: error, cashSettled: cash }), { initialProps: { stamp: 900, error: false, cash: 1000000 } })
  expect(result.current.gateOpen).toBe(false)
  rerender({ stamp: 1100, error: true, cash: 1000000 })
  expect(result.current.gateOpen).toBe(false)
  rerender({ stamp: 1200, error: false, cash: 500000 })
  expect(result.current.gateOpen).toBe(true)
  expect(result.current.buyLimit).toBe(200000)
})

it.each([0, 1000, Number.NaN])('갱신 시각 %s는 종료 이후 성공 응답이 아니다', (cashUpdatedAt) => {
  const { result } = renderHook(() => useRebalanceBuyPhase({ ...base, cashUpdatedAt }))
  expect(result.current.gateOpen).toBe(false)
  expect(result.current.buyLimit).toBe(0)
})

it('새 현금이어도 조회 중에는 열지 않는다', () => {
  const { result } = renderHook(() => useRebalanceBuyPhase({ ...base, cashUpdatedAt: 1200, isFetching: true }))
  expect(result.current.gateOpen).toBe(false)
})
