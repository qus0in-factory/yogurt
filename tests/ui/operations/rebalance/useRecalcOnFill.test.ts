// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
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

it('체결 종료 이벤트는 입력·남길 금액 재조회가 성공하면 한 번 재계산한다', async () => {
  const refreshInputs = vi.fn(), refreshKeep = vi.fn(), recalc = vi.fn()
  const { rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, refreshKeep, recalc }), {
    initialProps: { fillEventsByKey: filled } as Partial<Base>,
  })
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  expect(refreshKeep).toHaveBeenCalledTimes(1)
  expect(recalc).not.toHaveBeenCalled()

  rerender({ fillEventsByKey: filled, dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))
  rerender({ fillEventsByKey: filled, dataUpdatedAt: 12, keepUpdatedAt: 12 } as Partial<Base>)
  expect(recalc).toHaveBeenCalledTimes(1)
})

it('남길 금액 저장 성공 버전은 한 번만 재조회·재계산한다', async () => {
  const refreshInputs = vi.fn(), refreshKeep = vi.fn(), recalc = vi.fn()
  const { rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, refreshKeep, recalc }), {
    initialProps: {} as Partial<Base>,
  })
  expect(refreshInputs).not.toHaveBeenCalled()

  rerender({ savedKeepVersion: 1 } as Partial<Base>)
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  rerender({ savedKeepVersion: 1, dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))
  rerender({ savedKeepVersion: 1, dataUpdatedAt: 12, keepUpdatedAt: 12 } as Partial<Base>)
  expect(recalc).toHaveBeenCalledTimes(1)
})

it('주문 실패·취소 성공 버전도 같은 재조회·재계산 경로를 쓴다', async () => {
  const refreshInputs = vi.fn(), refreshKeep = vi.fn(), recalc = vi.fn()
  const { rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, refreshKeep, recalc }), {
    initialProps: {} as Partial<Base>,
  })
  rerender({ orderEventVersion: 2 } as Partial<Base>)
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  rerender({ orderEventVersion: 2, dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))
})

it('이벤트 없이 입력 시각만 바뀌면 표를 다시 계산하지 않는다', () => {
  const refreshInputs = vi.fn(), recalc = vi.fn()
  const { rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, recalc }), {
    initialProps: {} as Partial<Base>,
  })
  rerender({ dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  expect(refreshInputs).not.toHaveBeenCalled()
  expect(recalc).not.toHaveBeenCalled()
})
