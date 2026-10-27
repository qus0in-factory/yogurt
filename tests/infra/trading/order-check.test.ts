import { describe, expect, it } from 'vitest'
import { ok, setupRoutes } from './order-routes.test.ts'
import { pinOpenMarket } from './market-time.ts'

describe('확인 조회 수량 검증', () => {
  pinOpenMarket()
  it('수량이 가능 수량을 넘으면 400 ORDER_QUANTITY_EXCEEDED다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '2', ord_psbl_amt: '20000' } }))
    const res = await call('/api/accounts/a1/products/01/orders/check', { requestId: 'c3', code: '005930', side: 'buy', orderType: 'ioc', quantity: 3, price: 10000 })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'ORDER_QUANTITY_EXCEEDED' })
  })

  it('수량이 0 이하면 400이다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } }))
    expect((await call('/api/accounts/a1/products/01/orders/check', { requestId: 'c4', code: '005930', side: 'buy', orderType: 'ioc', quantity: 0, price: 10000 })).status).toBe(400)
  })

  it('매도 확인도 매수와 같은 계약(availableQty·availableWon)으로 응답한다', async () => {
    const { call } = setupRoutes((url) => {
      if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      return ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '4' }] })
    })
    const res = await call('/api/accounts/a1/products/01/orders/check', { requestId: 'c5', code: '005930', side: 'sell', orderType: 'ioc', quantity: 2 })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ availableQty: 4, availableWon: 196000 })
  })
})
