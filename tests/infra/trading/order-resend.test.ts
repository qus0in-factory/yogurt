import { describe, expect, it } from 'vitest'
import { fresh, ok, orderCalls, setupRoutes } from './order-routes.test.ts'

describe('주문 재시도와 가격 유형', () => {
  const buyOk = (url: string) => url.includes('inquire-psbl-order')
    ? ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
    : url.includes('asking-price')
      ? ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      : ok({ rt_cd: '0', output: { ODNO: '7' } })
  const body = { requestId: 'r1', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
  it('KIS 주문 성공 후 finish 저장이 실패해도 같은 id 재시도는 주문을 다시 보내지 않는다', async () => {
    const { call, client } = setupRoutes(buyOk, true, { failOn: "'succeeded'" })
    const id = { ...body, requestId: 'r5' }
    expect((await call('/api/accounts/a1/products/01/orders', id)).status).toBe(502)
    const replay = await call('/api/accounts/a1/products/01/orders', id)
    expect(replay.status).toBe(200)
    expect(await replay.json()).toMatchObject({ code: 'ORDER_UNKNOWN' })
    expect(orderCalls(client, 'order-cash')).toHaveLength(1)
  })
  it('KIS 거부가 확실하면 해제되고 같은 id 재시도가 주문을 한 번 보낸다', async () => {
    let calls = 0
    const { call, client } = setupRoutes((url) => {
      if (url.includes('inquire-psbl-order')) return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
      if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      calls += 1
      if (calls === 1) return ok({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '잔고가 부족합니다' })
      return ok({ rt_cd: '0', output: { ODNO: '8' } })
    })
    const id = { ...body, requestId: 'r6' }
    expect((await call('/api/accounts/a1/products/01/orders', id)).status).toBe(400)
    expect((await call('/api/accounts/a1/products/01/orders', id)).status).toBe(200)
    expect(orderCalls(client, 'order-cash')).toHaveLength(2)
  })
  it('가격 생략을 허용하고 주문 본문에 최유리 IOC 구분을 넣는다', async () => {
    const { call, client } = setupRoutes((url) => {
      if (url.includes('order-cash')) return ok({ rt_cd: '0', output: { ODNO: '9' } })
      if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
    })
    const noPrice = { requestId: 'r7', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', checkAt: fresh(), checkQty: 5 }
    expect((await call('/api/accounts/a1/products/01/orders', noPrice)).status).toBe(200)
    const zeroPrice = { ...noPrice, requestId: 'r8', price: 0 }
    expect((await call('/api/accounts/a1/products/01/orders', zeroPrice)).status).toBe(400)
    const bodies = orderCalls(client, 'order-cash').map(([, o]) => (o as { body: Record<string, string> }).body)
    expect(bodies).toEqual([{ CANO: '12345678', ACNT_PRDT_CD: '01', PDNO: '005930', ORD_DVSN: '15', ORD_QTY: '1', ORD_UNPR: '0' }])
  })
  it('재조회 네트워크 실패 시 주문 0회·해제 후 같은 id 재시도가 주문 1회를 보낸다', async () => {
    let calls = 0
    const { call, client } = setupRoutes((url) => {
      if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      if (url.includes('inquire-psbl-order')) {
        calls += 1
        if (calls === 1) throw new Error('network down')
        return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
      }
      return ok({ rt_cd: '0', output: { ODNO: '10' } })
    })
    const id = { ...body, requestId: 'r10' }
    expect((await call('/api/accounts/a1/products/01/orders', id)).status).toBe(502)
    expect((await call('/api/accounts/a1/products/01/orders', id)).status).toBe(200)
    expect(orderCalls(client, 'order-cash')).toHaveLength(1)
  })
  it('재조회 부족 후 같은 id 재시도는 409가 아니라 다시 검증한다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '0', ord_psbl_amt: '0' } }))
    const short = { ...body, requestId: 'r11', quantity: 9, checkQty: 9 }
    expect((await call('/api/accounts/a1/products/01/orders', short)).status).toBe(400)
    expect((await call('/api/accounts/a1/products/01/orders', short)).status).toBe(400)
  })
})
