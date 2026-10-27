import { describe, expect, it } from 'vitest'
import { fresh, ok, orderCalls, setupRoutes } from './order-routes.test.ts'
import { pinOpenMarket } from './market-time.ts';

describe('주문 실행 라우트', () => {
  pinOpenMarket()
  const buyOk = (url: string) => url.includes('inquire-psbl-order')
    ? ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
    : url.includes('asking-price')
      ? ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      : ok({ rt_cd: '0', output: { ODNO: '7' } })
  const body = { requestId: 'r1', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
  it('실행 전 재조회 후 주문하고 같은 id 동시 요청은 주문 1회만 나간다', async () => {
    const { call, client } = setupRoutes(buyOk)
    const [first, second] = await Promise.all([
      call('/api/accounts/a1/products/01/orders', body),
      call('/api/accounts/a1/products/01/orders', { ...body }),
    ])
    expect([first.status, second.status].sort()).toEqual([200, 409])
    expect(orderCalls(client, 'order-cash')).toHaveLength(1)
  })
  it('재조회 가능 수량이 부족하면 주문 호출 없이 400이다', async () => {
    const { call, client } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '0', ord_psbl_amt: '0' } }))
    const short = { ...body, requestId: 'r2', quantity: 9, checkQty: 9 }
    expect((await call('/api/accounts/a1/products/01/orders', short)).status).toBe(400)
    expect(orderCalls(client, 'order-cash')).toHaveLength(0)
  })
  it('매도 수량이 보유 가능 수량을 넘으면 거부한다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '2' }] }))
    const sell = { requestId: 'r3', code: '005930', quantity: 5, side: 'sell', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
    expect((await call('/api/accounts/a1/products/01/orders', sell)).status).toBe(400)
  })
  it('완료된 id는 저장된 주문 번호를 돌려주고 KIS를 호출하지 않는다', async () => {
    const { call, client } = setupRoutes(buyOk)
    expect((await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'r4' })).status).toBe(200)
    client.request.mockClear()
    const replay = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'r4' })
    expect(replay.status).toBe(200)
    expect(await replay.json()).toMatchObject({ orderNo: '7' })
    expect(client.request).not.toHaveBeenCalled()
  })

  it('같은 요청 id라도 계좌가 다르면 별도 클레임으로 주문한다', async () => {
    const { call, client } = setupRoutes(buyOk)
    const first = await call('/api/accounts/a1/products/01/orders', { ...body, requestId: 'shared' })
    const second = await call('/api/accounts/a2/products/01/orders', { ...body, requestId: 'shared' })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(orderCalls(client, 'order-cash')).toHaveLength(2)
  })
})
