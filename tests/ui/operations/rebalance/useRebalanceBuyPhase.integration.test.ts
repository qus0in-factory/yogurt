import { renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useRebalanceBuyPhase } from '../../../../src/ui/operations/rebalance/useRebalanceBuyPhase'

const base = {
  targetKey: 'a:01', calculatedAt: new Date(1300).toISOString(), isFetching: false,
  cashSettled: 400_000, cashUpdatedAt: 1200, isCashError: false, keepAmount: 100_000, refresh: vi.fn(),
}

it('재계산 시각이 종료 이벤트보다 늦어도 새 현금이면 게이트를 열고 한도를 계산한다', () => {
  const { result } = renderHook(() => useRebalanceBuyPhase({
    ...base, sellEvents: [{ pair: 'A:sell', status: 'closed_partial', at: 1100 }],
  }))
  expect(result.current.gateOpen).toBe(true)
  expect(result.current.buyLimit).toBe(300_000)
  expect(result.current.blockedReason).toBeNull()
})

it('진행 중 매도(pending/unknown/live partial)가 있으면 게이트를 닫는다', () => {
  type Props = { unknownKeys?: Set<string>; fillStatusesByKey?: Record<string, string> }
  const { result, rerender } = renderHook((props: Props) => useRebalanceBuyPhase({
    ...base, sellEvents: [{ pair: 'A:sell', status: 'closed_partial', at: 1100 }], ...props,
  }), { initialProps: { unknownKeys: new Set(['A:sell']), fillStatusesByKey: {} } as Props })
  expect(result.current.gateOpen).toBe(false)

  rerender({ fillStatusesByKey: { 'A:sell': 'partial' } })
  expect(result.current.gateOpen).toBe(false)

  rerender({ fillStatusesByKey: { 'A:sell': 'filled' } })
  expect(result.current.gateOpen).toBe(true)
})

it('체결 0 취소는 진행 중 매도가 아니므로 게이트를 닫지 않는다', () => {
  const { result } = renderHook(() => useRebalanceBuyPhase({
    ...base, sellEvents: [{ pair: 'A:sell', status: 'cancelled', at: 1100 }],
  }))
  expect(result.current.gateOpen).toBe(true)
  expect(result.current.blockedReason).toBeNull()
})
