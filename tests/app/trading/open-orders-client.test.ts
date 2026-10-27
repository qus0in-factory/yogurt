import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { cancelOpenOrder, fetchOpenOrders } from '../../../src/app/trading/open-orders-client'

const server = setupServer()
const base = `${window.location.origin}/api/accounts/a%2Fb/products/01/orders`
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
const order = { orderId: 'O-1', orgNo: '001', code: '005930', name: '삼성전자', side: 'buy', orderQty: 10, filledQty: 3, remainingQty: 7, price: 70000, orderedAt: '101010' }

it('미체결 목록을 조회하고 응답을 검증한다', async () => {
  server.use(http.get(`${base}/open`, () => HttpResponse.json({ orders: [order] })))
  expect(await fetchOpenOrders('a/b', '01')).toEqual([order])
})

it('취소는 POST 본문과 성공·실패 응답을 그대로 다룬다', async () => {
  let body: unknown
  server.use(http.post(`${base}/O-1/cancel`, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json({ ok: true, cancelOrderId: 'C-1' })
  }))
  expect(await cancelOpenOrder('a/b', '01', 'O-1', '001')).toEqual({ ok: true, cancelOrderId: 'C-1' })
  expect(body).toEqual({ orgNo: '001' })

  server.use(http.post(`${base}/O-1/cancel`, () => HttpResponse.json({ ok: false, code: 'APBK', message: '취소 불가' }, { status: 502 })))
  expect(await cancelOpenOrder('a/b', '01', 'O-1', '001')).toEqual({ ok: false, code: 'APBK', message: '취소 불가' })
})
