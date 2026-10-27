import { renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useRebalanceBuyPhase } from '../../../../src/ui/operations/rebalance/useRebalanceBuyPhase'
const base = { sellEvents: [], cashSettled: 400000, keepAmount: 100000, cashUpdatedAt: 1200, isFetching: false, isCashError: false, refresh: vi.fn() }
it('매도 이력이 없어도 성공한 현금 조회가 필요하다', () => {
  const { result, rerender } = renderHook(({ stamp }) => useRebalanceBuyPhase({ ...base, cashUpdatedAt: stamp }), { initialProps: { stamp: 0 } })
  expect(result.current.gateOpen).toBe(false)
  expect(result.current.buyLimit).toBe(0)
  rerender({ stamp: 1200 })
  expect(result.current.gateOpen).toBe(true)
})
it.each(['not_found', 'rate_limited', 'unknown'])('미확인 매도 %s는 게이트를 막는다', (status) => {
  const { result } = renderHook(() => useRebalanceBuyPhase({ ...base, fillStatusesByKey: { 'A:sell': status } }))
  expect(result.current.gateOpen).toBe(false)
})
it('접수된 매도는 첫 응답 전과 주문번호가 없을 때도 잠금을 유지한다', () => {
  const completedKeys = new Set(['A:sell'])
  const { result, rerender } = renderHook(({ status }: { status?: string }) => useRebalanceBuyPhase({ ...base, completedKeys, fillStatusesByKey: status ? { 'A:sell': status } : {} }), { initialProps: {} as { status?: string } })
  expect(result.current.gateOpen).toBe(false)
  for (const status of ['partial', 'not_found', 'rate_limited', 'unknown']) {
    rerender({ status })
    expect(result.current.gateOpen).toBe(false)
  }
  for (const status of ['filled', 'closed_partial', 'cancelled']) {
    rerender({ status })
    expect(result.current.gateOpen).toBe(true)
  }
})
it('pending/unknown에서 done으로 바뀌어도 종료 전 잠금이 풀리지 않는다', () => {
  const { result, rerender } = renderHook(({ accepted }) => useRebalanceBuyPhase({ ...base, unknownKeys: new Set(accepted ? [] : ['A:sell']), completedKeys: new Set(accepted ? ['A:sell'] : []) }), { initialProps: { accepted: false } })
  expect(result.current.gateOpen).toBe(false)
  rerender({ accepted: true })
  expect(result.current.gateOpen).toBe(false)
})
