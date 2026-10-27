import { renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useRebalanceOrderSync } from '../../../../src/ui/operations/rebalance/useRebalanceOrderSync'
import { useRebalanceFillStream } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'
import { useRebalanceBuyPhase } from '../../../../src/ui/operations/rebalance/useRebalanceBuyPhase'
import { REBALANCE_ORDERS_STORAGE_KEY } from '../../../../src/ui/operations/rebalance/rebalance-order-store'
vi.mock('../../../../src/ui/operations/rebalance/useReconcileUnknownOrders', () => ({ useReconcileUnknownOrders: () => {} }))
vi.mock('../../../../src/app/trading/fill-stream', () => ({ subscribeFills: () => vi.fn() }))
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))
afterEach(() => sessionStorage.clear())
it.each(['O-1', undefined])('접수 기록 %s가 실제 동기화 경로에서 매수를 막는다', (orderId) => {
  sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({ 'a:01:A:sell': { requestId: 'r', state: 'done', orderId, updatedAt: '' } }))
  const { result } = renderHook(() => {
    const target = { accountId: 'a', productCode: '01' }
    const sync = useRebalanceOrderSync(target)
    const fills = useRebalanceFillStream(target, sync.orders, sync.handleClearKey)
    return useRebalanceBuyPhase({ sellEvents: fills.sellEvents, fillStatusesByKey: fills.fillStatusesByKey, unknownKeys: sync.unknownKeys, completedKeys: sync.completedKeys, cashUpdatedAt: 1200, cashSettled: 400000, keepAmount: 100000, isFetching: false, refresh: vi.fn() })
  })
  expect(result.current.gateOpen).toBe(false)
  expect(result.current.buyLimit).toBe(0)
})
