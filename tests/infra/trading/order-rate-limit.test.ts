import { describe, expect, it } from 'vitest'
import { fresh, ok, orderCalls, setupRoutes } from './order-routes.test.ts'
import { pinOpenMarket } from './market-time.ts'

const rateLimited = { rt_cd: '1', msg_cd: 'EGW00201', msg1: '초당 거래건수를 초과하였습니다.' }

describe('초당 제한 주문 거절', () => {
  pinOpenMarket()
  it('EGW00201은 400 RATE_LIMITED, 해제 후 같은 id 재시도는 주문 1회씩이다', async () => {
    let limited = true
    const { call, client } = setupRoutes((url: string) => {
      if (url.includes('inquire-psbl-order')) return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
      if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      return limited ? ok(rateLimited) : ok({ rt_cd: '0', output: { ODNO: '7' } })
    })
    const body = { requestId: 'rl1', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
    const first = await call('/api/accounts/a1/products/01/orders', body)
    expect(first.status).toBe(400)
    expect(await first.json()).toMatchObject({ code: 'RATE_LIMITED' })
    expect(orderCalls(client, 'order-cash')).toHaveLength(1)
    const second = await call('/api/accounts/a1/products/01/orders', { ...body })
    expect(second.status).toBe(400)
    expect(orderCalls(client, 'order-cash')).toHaveLength(2)
    limited = false
    const third = await call('/api/accounts/a1/products/01/orders', { ...body })
    expect(third.status).toBe(200)
    expect(orderCalls(client, 'order-cash')).toHaveLength(3)
  })
})
