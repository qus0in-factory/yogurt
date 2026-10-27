import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearClientStorage } from '../../../../src/ui/state/clear-client-storage'
import {
  clearDoneOrders,
  loadStoredOrders,
  saveOrderRecord,
  toRebalanceOrderKey,
  REBALANCE_ORDERS_STORAGE_KEY,
} from '../../../../src/ui/operations/rebalance/rebalance-order-store'

vi.mock('idb-keyval', () => ({ del: vi.fn() }))

beforeEach(() => { sessionStorage.clear() })
afterEach(() => { sessionStorage.clear() })

describe('rebalance-order-store', () => {
  it('저장 키는 yogurt:rebalance-orders 여야 한다', () => {
    expect(REBALANCE_ORDERS_STORAGE_KEY).toBe('yogurt:rebalance-orders')
  })

  it('계좌 id 및 구분(buy|sell)이 항목 키에 사용되고 none 행은 상태 키가 없다', () => {
    const key = toRebalanceOrderKey('acc-uuid-1', '01', '005930', 'buy')
    expect(key).toBe('acc-uuid-1:01:005930:buy')
    expect(key).not.toContain('12345678')
    expect(toRebalanceOrderKey('acc-uuid-1', '01', '005930', 'none')).toBeNull()
  })

  it('구분(buy|sell)이 없는 구버전 키는 읽을 때 무시한다', () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930': { requestId: 'legacy-1', state: 'done' },
      'acc-1:01:005930:buy': { requestId: 'new-1', state: 'done' },
    }))
    const loaded = loadStoredOrders()
    expect(loaded['acc-1:01:005930']).toBeUndefined()
    expect(loaded['acc-1:01:005930:buy']).toMatchObject({ requestId: 'new-1', state: 'done' })
  })

  it('주문 상태와 주문 수량 및 주문 번호를 함께 저장하고 로드한다', () => {
    const key = 'acc-1:01:005930:buy'
    const step1 = saveOrderRecord({}, key, 'req-1', 'pending', 8)
    expect(step1[key]).toMatchObject({ requestId: 'req-1', state: 'pending', orderQuantity: 8 })

    const step2 = saveOrderRecord(step1, key, 'req-1', 'done', 6, 'ORD-99')
    expect(step2[key]).toMatchObject({ state: 'done', orderQuantity: 6, orderId: 'ORD-99' })
    expect(loadStoredOrders()[key]).toMatchObject({ requestId: 'req-1', state: 'done', orderQuantity: 6, orderId: 'ORD-99' })
  })

  it('clearDoneOrders는 현재 계좌·상품의 done 상태만 지우고 다른 계좌 done과 pending/unknown을 유지한다', () => {
    const initial = {
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done' as const, updatedAt: 't' },
      'acc-1:01:000660:sell': { requestId: 'r2', state: 'unknown' as const, updatedAt: 't' },
      'acc-2:22:005930:buy': { requestId: 'r3', state: 'done' as const, updatedAt: 't' },
    }
    const cleared = clearDoneOrders(initial, 'acc-1', '01')
    expect(cleared['acc-1:01:005930:buy']).toBeUndefined()
    expect(cleared['acc-1:01:000660:sell']).toMatchObject({ state: 'unknown' })
    expect(cleared['acc-2:22:005930:buy']).toMatchObject({ state: 'done' })
  })

  it('clearClientStorage(로그아웃) 시 sessionStorage의 주문 상태 키가 삭제된다', async () => {
    saveOrderRecord({}, 'acc-1:01:005930:buy', 'req-1', 'done', 5)
    expect(sessionStorage.getItem(REBALANCE_ORDERS_STORAGE_KEY)).not.toBeNull()
    await clearClientStorage(false)
    expect(sessionStorage.getItem(REBALANCE_ORDERS_STORAGE_KEY)).toBeNull()
  })
})
