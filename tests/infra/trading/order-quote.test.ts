import { describe, expect, it } from 'vitest'
import { fresh, ok, orderCalls, setupRoutes } from './order-routes.test.ts'

const body = { requestId: 'r1', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
const quotes = (ask: unknown, bid: unknown) => (url: string) => {
  if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: ask, bidp1: bid } })
  if (url.includes('inquire-psbl-order')) return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
  if (url.includes('inquire-balance')) return ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '5' }] })
  return ok({ rt_cd: '0', output: { ODNO: '7' } })
}

describe('주문 시 호가 확인', () => {
  it('호가가 없으면 주문 0회·400 NO_QUOTE 후 같은 id 재시도가 막히지 않는다', async () => {
    const { call, client } = setupRoutes(quotes('0', '0'))
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q1' })).status).toBe(400)
    const replay = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q1' })
    expect(replay.status).toBe(400)
    expect(await replay.json()).toMatchObject({ code: 'NO_QUOTE' })
    expect(orderCalls(client, 'order-cash')).toHaveLength(0)
  })

  it('호가 조회 실패는 502이고 주문을 보내지 않는다', async () => {
    const { call, client } = setupRoutes((url) => {
      if (url.includes('asking-price')) throw new Error('down')
      return quotes('1', '1')(url)
    })
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q2' })).status).toBe(502)
    expect(orderCalls(client, 'order-cash')).toHaveLength(0)
  })

  it('매수 성공 응답에 ask1 예상 가격이 들어간다', async () => {
    const { call } = setupRoutes(quotes('50000', '49000'))
    const res = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q3' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ orderNo: '7', expectedPrice: 50000 })
  })

  it('매도 성공 응답에 bid1 예상 가격이 들어간다', async () => {
    const { call } = setupRoutes(quotes('50000', '49000'))
    const sell = { requestId: 'q4', code: '005930', quantity: 1, side: 'sell', orderType: 'ioc', checkAt: fresh(), checkQty: 5 }
    const res = await call('/api/accounts/a1/products/01/orders', sell)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ orderNo: '7', expectedPrice: 49000 })
  })

  it('호가 조회는 주문 한 건당 한 번만 호출된다', async () => {
    const { call, client } = setupRoutes(quotes('50000', '49000'))
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q5' })).status).toBe(200)
    expect(orderCalls(client, 'asking-price')).toHaveLength(1)
  })

  it('호가 첫 실패 후 재시도 성공이면 예상 가격으로 주문이 한 번 나간다', async () => {
    let calls = 0
    const { call, client } = setupRoutes((url) => {
      if (url.includes('asking-price')) {
        calls += 1
        if (calls === 1) throw new Error('down')
        return ok({ rt_cd: '0', output1: { askp1: '51000', bidp1: '50000' } })
      }
      return quotes('1', '1')(url)
    })
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q6' })).status).toBe(502)
    const replay = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q6' })
    expect(replay.status).toBe(200)
    expect(await replay.json()).toMatchObject({ expectedPrice: 51000 })
    expect(orderCalls(client, 'order-cash')).toHaveLength(1)
  })

  it('호가 장애 후 같은 id 재시도는 409가 아니라 다시 검증한다', async () => {
    const { call, client } = setupRoutes((url) => {
      if (url.includes('asking-price')) throw new Error('down')
      return quotes('1', '1')(url)
    })
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q7' })).status).toBe(502)
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'q7' })).status).toBe(502)
    expect(orderCalls(client, 'order-cash')).toHaveLength(0)
  })
})
