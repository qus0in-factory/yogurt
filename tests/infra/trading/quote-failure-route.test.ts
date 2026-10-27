import { describe, expect, it } from 'vitest'
import { fresh, ok, setupRoutes } from './order-routes.test.ts'
import { pinOpenMarket } from './market-time.ts'

const body = { requestId: 'r1', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: fresh(), checkQty: 5 }
const checkBody = { requestId: 'c1', code: '005930', side: 'sell', orderType: 'ioc', quantity: 2 }

const empty = () => new Response('', { status: 200 })

describe('호가 조회 실패 안전 처리(라우트)', () => {
  pinOpenMarket()

  it('확인 라우트: 호가가 빈 본문이면 500이 아니라 502를 돌려준다', async () => {
    const { call } = setupRoutes((url) => url.includes('asking-price') ? empty() : ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '4' }] }))
    const res = await call('/api/accounts/a1/products/01/orders/check', checkBody)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ code: 'ORDER_CHECK_FAILED' })
  })

  it('실행 라우트: 호가 빈 본문은 502이고 클레임이 해제되어 같은 requestId로 다시 주문한다', async () => {
    let goodQuotes = false
    const { call } = setupRoutes((url) => {
      if (url.includes('asking-price')) return goodQuotes ? ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } }) : empty()
      if (url.includes('inquire-psbl-order')) return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
      if (url.includes('order-cash')) return ok({ rt_cd: '0', output: { ODNO: '7' } })
      return ok({ rt_cd: '0', output1: {} })
    })
    expect((await call('/api/accounts/a1/products/01/orders', body)).status).toBe(502)
    goodQuotes = true
    const retry = await call('/api/accounts/a1/products/01/orders', body)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toMatchObject({ orderNo: '7' })
  })

  it('실행 라우트: 호가 필드가 없으면 500이 아니라 400 NO_QUOTE다', async () => {
    const { call } = setupRoutes((url) => {
      if (url.includes('asking-price')) return ok({ rt_cd: '0', output1: { odno: 'O-1' } })
      if (url.includes('inquire-psbl-order')) return ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } })
      return ok({ rt_cd: '0', output1: {} })
    })
    const res = await call('/api/accounts/a1/products/01/orders', body)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'NO_QUOTE' })
  })
})
