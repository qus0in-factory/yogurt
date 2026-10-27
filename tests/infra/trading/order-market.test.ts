import { describe, expect, it, vi } from 'vitest'
import { fresh, ok, orderCalls, setupRoutes } from './order-routes.test.ts'
import { pinOpenMarket } from './market-time.ts'

pinOpenMarket()

const buyOk = (url: string) => {
  if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
  if (url.includes('inquire-psbl-order')) return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
  if (url.includes('inquire-balance')) return ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '5' }] })
  return ok({ rt_cd: '0', output: { ODNO: '7' } })
}
const body = { requestId: 'r1', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
const checkBody = { requestId: 'c0', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000 }
const closedAt = (iso: string) => { vi.setSystemTime(new Date(iso)) }

describe('장 마감 시 주문 차단', () => {
  it('장이 닫히면 확인은 400 MARKET_CLOSED이고 KIS를 호출하지 않는다', async () => {
    closedAt('2026-10-25T01:00:00Z')
    const { call, client } = setupRoutes(buyOk)
    const res = await call('/api/accounts/a1/products/01/orders/check', { ...checkBody, requestId: 'm1' })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'MARKET_CLOSED', reason: 'weekend', nextOpenAt: expect.any(String) })
    expect(client.request).not.toHaveBeenCalled()
  })

  it('장이 닫히면 실행은 400이고 KIS를 호출하지 않는다', async () => {
    closedAt('2026-10-26T10:00:00Z')
    const { call, client } = setupRoutes(buyOk)
    const res = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'm2' })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'MARKET_CLOSED' })
    expect(client.request).not.toHaveBeenCalled()
  })

  it('실행 시 장이 닫히면 클레임이 해제되어 장중에 같은 id로 주문할 수 있다', async () => {
    closedAt('2026-10-26T10:00:00Z')
    const { call, client } = setupRoutes(buyOk)
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'm3' })).status).toBe(400)
    closedAt('2026-10-26T01:00:00Z')
    const res = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'm3' })
    expect(res.status).toBe(200)
    expect(orderCalls(client, 'order-cash')).toHaveLength(1)
  })
})
