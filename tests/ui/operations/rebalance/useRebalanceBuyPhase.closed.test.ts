// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useRebalanceBuyPhase } from '../../../../src/ui/operations/rebalance/useRebalanceBuyPhase'
import type { RebalancePlan } from '../../../../src/domain/rebalance/types'

const plan: RebalancePlan = {
  orders: [], leftoverCash: 0, warnings: [],
  items: [{ code: 'A', name: 'A', targetQuantity: 0, currentQuantity: 10, orderQuantity: 10, side: 'sell' }],
}

it('부분 매도 종료는 실제 체결 현금으로 게이트를 열고 과매수하지 않는다', async () => {
  const at = Date.now()
  const refresh = vi.fn(), calculatedAt = new Date(Date.now() - 1000).toISOString()
  const { result } = renderHook(() => useRebalanceBuyPhase({
    targetKey: 'a:01', plan, calculatedAt,
    sellEvents: [{ pair: 'A:sell', status: 'closed_partial', at }],
    cashUpdatedAt: at + 1, isCashError: false, isFetching: false, cashSettled: 1_000_000, keepAmount: 300_000, refresh,
  }))
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
  expect(result.current.gateOpen).toBe(true)
  expect(result.current.buyLimit).toBe(700_000)
})
