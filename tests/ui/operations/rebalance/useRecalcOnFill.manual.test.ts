// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useRecalcOnFill } from '../../../../src/ui/operations/rebalance/useRecalcOnFill'

const inputs = {
  holdings: [], cashAvailable: 0, cashSettled: 0, targets: [], prices: {}, priceFailed: [], hasPortfolio: true,
}
type Props = Parameters<typeof useRecalcOnFill>[0]
type Base = Omit<Props, 'recalc' | 'refreshInputs' | 'refreshKeep'>
const base: Base = {
  targetKey: 'a:01', fillEventsByKey: {}, savedKeepVersion: 0, orderEventVersion: 0,
  inputs, isFetching: false, isError: false, dataUpdatedAt: 10, keepUpdatedAt: 10,
  isKeepFetching: false, isKeepLoadError: false, isKeepSaveError: false, blocked: false, canRecalc: true,
}
const filled = { 'A:sell': 'filled' as const }

it('다시 계산은 새 조회가 끝난 뒤 한 번만 계산하고 중복 클릭을 무시한다', async () => {
  const refreshInputs = vi.fn(), refreshKeep = vi.fn(), recalc = vi.fn()
  const { result, rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, refreshKeep, recalc }), {
    initialProps: {} as Partial<Base>,
  })
  act(() => result.current.recalcNow())
  expect(refreshInputs).toHaveBeenCalledTimes(1)
  expect(refreshKeep).toHaveBeenCalledTimes(1)
  expect(result.current.isRecalculating).toBe(true)
  expect(recalc).not.toHaveBeenCalled()

  act(() => result.current.recalcNow())
  expect(refreshInputs).toHaveBeenCalledTimes(1)

  rerender({ dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))
  expect(result.current.isRecalculating).toBe(false)
})

it('재조회가 실패하거나 차단 상태면 재계산하지 않는다', async () => {
  const refreshInputs = vi.fn(), refreshKeep = vi.fn(), recalc = vi.fn()
  const { result, rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, refreshKeep, recalc }), {
    initialProps: { fillEventsByKey: filled } as Partial<Base>,
  })
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  rerender({ fillEventsByKey: filled, isError: true, dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(result.current.isRecalculating).toBe(false))
  expect(recalc).not.toHaveBeenCalled()

  const blockedRefresh = vi.fn(), blockedRecalc = vi.fn()
  renderHook(() => useRecalcOnFill({ ...base, fillEventsByKey: filled, blocked: true, refreshInputs: blockedRefresh, refreshKeep, recalc: blockedRecalc }))
  expect(blockedRefresh).not.toHaveBeenCalled()
  expect(blockedRecalc).not.toHaveBeenCalled()
})
