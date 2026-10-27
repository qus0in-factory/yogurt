import { renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useReconcileUnknownOrders } from '../../../../src/ui/operations/rebalance/useReconcileUnknownOrders'
import { fetchDailyOrders } from '../../../../src/app/trading/daily-orders-client'
vi.mock('../../../../src/app/trading/daily-orders-client')
const target = { accountId: 'a', productCode: '01' }
const key = 'a:01:455890:sell'
const record = { requestId: 'r', state: 'unknown' as const, orderQuantity: 64, updatedAt: '2026-10-27T00:00:00Z' }
const row = { orderNo: 'O1', code: '455890', side: 'sell' as const, orderedQty: 64, orderedAt: '2026-10-27T00:00:01Z' }

it.each(['match', 'absent', 'failure'])('%s 조회 결과를 기록에 반영한다', async (kind) => {
  vi.mocked(fetchDailyOrders).mockReset()
  if (kind === 'failure') vi.mocked(fetchDailyOrders).mockRejectedValue(new Error('network'))
  else vi.mocked(fetchDailyOrders).mockResolvedValue(kind === 'absent' ? [] : [row])
  const resolve = vi.fn()
  renderHook(() => useReconcileUnknownOrders(target, { [key]: record }, resolve))
  await waitFor(() => expect(fetchDailyOrders).toHaveBeenCalledTimes(1))
  await new Promise((r) => setTimeout(r, 0))
  if (kind === 'failure') expect(resolve).not.toHaveBeenCalled()
  else if (kind === 'match') expect(resolve).toHaveBeenCalledWith(key, 'r', 'O1')
  else expect(resolve).toHaveBeenCalledWith(key, 'r', null, 'absent')
})

it('지난 거래일 기록은 조회 없이 past로 정리한다', async () => {
  vi.mocked(fetchDailyOrders).mockReset()
  const resolve = vi.fn()
  const past = { ...record, requestedAt: '2026-10-26T00:00:00Z', updatedAt: '2026-10-26T00:00:00Z' }
  renderHook(() => useReconcileUnknownOrders(target, { [key]: past }, resolve))
  await waitFor(() => expect(resolve).toHaveBeenCalledWith(key, 'r', null, 'past'))
  expect(fetchDailyOrders).not.toHaveBeenCalled()
})

it('updatedAt가 요청보다 90초 늦어도 요청-120초 이후 주문을 매칭한다', async () => {
  vi.mocked(fetchDailyOrders).mockReset().mockResolvedValue([row])
  const resolve = vi.fn()
  const late = { ...record, requestedAt: '2026-10-27T00:00:00Z', updatedAt: '2026-10-27T00:01:30Z' }
  renderHook(() => useReconcileUnknownOrders(target, { [key]: late }, resolve))
  await waitFor(() => expect(resolve).toHaveBeenCalledWith(key, 'r', 'O1'))
})

it('후보가 2건 이상이면 기록을 유지한다', async () => {
  vi.mocked(fetchDailyOrders).mockReset().mockResolvedValue([row, { ...row, orderNo: 'O2' }])
  const resolve = vi.fn()
  renderHook(() => useReconcileUnknownOrders(target, { [key]: record }, resolve))
  await waitFor(() => expect(fetchDailyOrders).toHaveBeenCalledTimes(1))
  await new Promise((r) => setTimeout(r, 0))
  expect(resolve).not.toHaveBeenCalled()
})
