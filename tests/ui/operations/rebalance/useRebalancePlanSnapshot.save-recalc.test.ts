// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useRebalancePlanSnapshot } from '../../../../src/ui/operations/rebalance/useRebalancePlanSnapshot'

const inputs = (cash = 1_000_000) => ({
  holdings: [{ code: 'A', name: 'A', quantity: 10, evaluationAmount: 700_000 }],
  cashAvailable: cash, cashSettled: cash,
  targets: [{ kind: 'stock' as const, code: 'B', name: 'B', weightBps: 10000 }],
  prices: { A: 10_000, B: 10_000 }, priceFailed: [], hasPortfolio: true,
})
const base = (overrides = {}) => ({
  key: 'a:01', inputs: inputs(), keepAmount: 0, isKeepLoading: false,
  isKeepLoadError: false, isKeepSaveError: false, ...overrides,
})

it('같은 대상에서 남길 금액만 바뀌면 재계산 전까지 스냅샷을 유지한다', async () => {
  const { result, rerender } = renderHook((props) => useRebalancePlanSnapshot(props), { initialProps: base() })
  await waitFor(() => expect(result.current.snapshot?.keepAmount).toBe(0))

  rerender(base({ keepAmount: 100_000 }))
  expect(result.current.snapshot?.keepAmount).toBe(0)
  expect(result.current.keepChanged).toBe(true)
})

it('recalc는 최신 입력과 남길 금액을 표에 반영한다', async () => {
  const { result, rerender } = renderHook((props) => useRebalancePlanSnapshot(props), { initialProps: base() })
  await waitFor(() => expect(result.current.snapshot).not.toBeNull())

  rerender(base({ inputs: inputs(2_000_000), keepAmount: 100_000 }))
  act(() => result.current.recalc())
  await waitFor(() => expect(result.current.snapshot?.keepAmount).toBe(100_000))
  expect(result.current.snapshot?.inputs.cashSettled).toBe(2_000_000)
})

it('저장 실패 상태에서는 재계산하지 않고 차단한다', async () => {
  const { result, rerender } = renderHook((props) => useRebalancePlanSnapshot(props), { initialProps: base() })
  await waitFor(() => expect(result.current.snapshot?.keepAmount).toBe(0))

  rerender(base({ keepAmount: 100_000, isKeepSaveError: true }))
  act(() => result.current.recalc())
  expect(result.current.snapshot?.keepAmount).toBe(0)
  expect(result.current.blocked).toBe('keep-save')
})
