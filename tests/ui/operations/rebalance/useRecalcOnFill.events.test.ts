// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useRecalcOnFill } from '../../../../src/ui/operations/rebalance/useRecalcOnFill'
import type { FillEvent } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'

const inputs = {
  holdings: [], cashAvailable: 0, cashSettled: 0, targets: [], prices: {}, priceFailed: [], hasPortfolio: true,
}
type Props = Parameters<typeof useRecalcOnFill>[0]
type Base = Omit<Props, 'recalc' | 'refreshInputs' | 'refreshKeep'>
const base: Base = {
  targetKey: 'a:01', fillEventsByKey: {}, fillEventList: [], savedKeepVersion: 0, orderEventVersion: 0,
  inputs, isFetching: false, isError: false, dataUpdatedAt: 10, keepUpdatedAt: 10,
  isKeepFetching: false, isKeepLoadError: false, isKeepSaveError: false, blocked: false, canRecalc: true,
}
const event = (orderId: string): FillEvent => ({ orderId, pair: 'A:sell', status: 'filled', at: 1000 })

it('주문번호가 다른 종료 이벤트는 한 번에 합쳐 처리하고 같은 pair의 다음 주문은 다시 처리한다', async () => {
  const refreshInputs = vi.fn(), recalc = vi.fn()
  const { rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, recalc }), {
    initialProps: { fillEventList: [event('O1'), event('O2')] } as Partial<Base>,
  })
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  rerender({ fillEventList: [event('O1'), event('O2')], dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))

  rerender({ fillEventList: [event('O1'), event('O2'), event('O3')], dataUpdatedAt: 12, keepUpdatedAt: 12 } as Partial<Base>)
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(2))
  rerender({ fillEventList: [event('O1'), event('O2'), event('O3')], dataUpdatedAt: 13, keepUpdatedAt: 13 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(2))
})

it('차단 중 받은 종료 이벤트는 차단 해제 후 처리한다', async () => {
  const refreshInputs = vi.fn(), recalc = vi.fn()
  const { rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, recalc }), {
    initialProps: { fillEventList: [event('O1')], blocked: true } as Partial<Base>,
  })
  expect(refreshInputs).not.toHaveBeenCalled()
  rerender({ fillEventList: [event('O1')], blocked: false } as Partial<Base>)
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  rerender({ fillEventList: [event('O1')], blocked: false, dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))
})

it('재조회 실패 후 다음 성공 조회에서 대기 이벤트를 처리한다', async () => {
  const refreshInputs = vi.fn(), recalc = vi.fn()
  const { result, rerender } = renderHook((props: Partial<Base>) => useRecalcOnFill({ ...base, ...props, refreshInputs, recalc }), {
    initialProps: { fillEventList: [event('O1')] } as Partial<Base>,
  })
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(1))
  rerender({ fillEventList: [event('O1')], isError: true } as Partial<Base>)
  await waitFor(() => expect(result.current.isRecalculating).toBe(false))
  expect(recalc).not.toHaveBeenCalled()

  rerender({ fillEventList: [event('O1')], isError: false, dataUpdatedAt: 11, keepUpdatedAt: 11 } as Partial<Base>)
  await waitFor(() => expect(refreshInputs).toHaveBeenCalledTimes(2))
  rerender({ fillEventList: [event('O1')], isError: false, dataUpdatedAt: 12, keepUpdatedAt: 12 } as Partial<Base>)
  await waitFor(() => expect(recalc).toHaveBeenCalledTimes(1))
})
