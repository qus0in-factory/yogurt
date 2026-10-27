// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { checkPreOrder, executeOrder } from '../../../../src/app/trading/orders-client'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { retryRateLimitedCheck } from '../../../../src/ui/operations/rebalance/rebalance-check-retry'
import { runRebalanceCheck } from '../../../../src/ui/operations/rebalance/rebalance-check-runner'

vi.mock('../../../../src/app/trading/orders-client')
const item: RebalanceItem = { code: '005930', name: '삼성전자', currentQuantity: 10, targetQuantity: 15, orderQuantity: 5, side: 'sell' }
const params = { item, accountId: 'acc', productCode: '01', price: 70000, quantity: 5 }
const rate = () => Object.assign(new Error('rate'), { data: { code: 'ORDER_CHECK_FAILED', stage: 'sellable', kisCode: 'EGW00215', kisMessage: '초당 거래건수 초과' } })
const success = { code: '005930', side: 'sell' as const, availableQuantity: 8, estimatedAmount: 560000, price: 70000 }

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

it('제한 응답은 1초·2초 뒤 최대 2회만 자동 재확인하고 성공 결과를 반영하며 주문하지 않는다', async () => {
  vi.useFakeTimers()
  vi.mocked(checkPreOrder).mockRejectedValueOnce(rate()).mockRejectedValueOnce(rate()).mockResolvedValue(success)
  const pending = retryRateLimitedCheck(() => runRebalanceCheck(params), () => false)
  await vi.advanceTimersByTimeAsync(1000)
  await vi.advanceTimersByTimeAsync(2000)
  const outcome = await pending
  expect(checkPreOrder).toHaveBeenCalledTimes(3)
  expect(outcome.check?.availableQuantity).toBe(8)
  expect(outcome.checkFailure).toBeNull()
  expect(executeOrder).not.toHaveBeenCalled()
})

it('제한이 아닌 실패는 재확인하지 않고 취소되면 추가 호출도 없다', async () => {
  vi.useFakeTimers()
  vi.mocked(checkPreOrder).mockRejectedValue(Object.assign(new Error('unknown'), { data: { code: 'ORDER_CHECK_FAILED', kisCode: 'APBK0000' } }))
  const pending = retryRateLimitedCheck(() => runRebalanceCheck(params), () => true)
  await vi.advanceTimersByTimeAsync(3000)
  await pending
  expect(checkPreOrder).toHaveBeenCalledTimes(1)
})
