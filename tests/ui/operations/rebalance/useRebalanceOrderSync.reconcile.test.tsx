// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { marketText } from '../../../../src/ui/glossary/market'
import { REBALANCE_ORDERS_STORAGE_KEY } from '../../../../src/ui/operations/rebalance/rebalance-order-store'
import { useRebalanceOrderSync } from '../../../../src/ui/operations/rebalance/useRebalanceOrderSync'

const captured = vi.hoisted(() => ({ resolve: null as null | ((key: string, requestId: string, orderId: string | null, reason?: 'past' | 'absent') => void) }))
vi.mock('../../../../src/ui/operations/rebalance/useReconcileUnknownOrders', () => ({
  useReconcileUnknownOrders: (_target: unknown, _orders: unknown, resolve: typeof captured.resolve) => { captured.resolve = resolve },
}))
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }))

it('지난 거래일 정리는 전용 문구를 보이고 cleanupVersion을 올린다', () => {
  sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
    'a:01:455890:sell': { requestId: 'r', state: 'unknown', orderQuantity: 64, updatedAt: '2026-10-27T00:00:00Z' },
  }))
  const { result } = renderHook(() => useRebalanceOrderSync({ accountId: 'a', productCode: '01' }))
  act(() => captured.resolve?.('a:01:455890:sell', 'r', null, 'past'))
  expect(toast.info).toHaveBeenCalledWith(marketText.unknownRecord.pastDay)
  expect(result.current.cleanupVersion).toBe(1)
  expect(result.current.unknownKeys.size).toBe(0)
})
