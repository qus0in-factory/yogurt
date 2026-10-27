import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { checkSchema } from '../../../src/infra/trading/order-contracts'
import { checkPreOrder, executeOrder } from '../../../src/app/trading/orders-client'

const server = setupServer()
const base = `${window.location.origin}/api`
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const checkPath = `${base}/accounts/a%2Fb/products/01/orders/check`
const orderPath = `${base}/accounts/a%2Fb/products/01/orders`

it('확인 조회가 경로·본문을 맞추고 서버 응답을 화면 형태로 매핑한다', async () => {
  let body: unknown
  server.use(http.post(checkPath, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json({ availableQty: 3, availableWon: 30000 })
  }))
  const res = await checkPreOrder({ accountId: 'a/b', productCode: '01', code: '005930', side: 'buy', quantity: 2, price: 10000 })
  expect(body).toMatchObject({ code: '005930', side: 'buy', orderType: 'ioc', quantity: 2, price: 10000 })
  expect(checkSchema.safeParse(body).success).toBe(true)
  expect(res).toEqual({ code: '005930', side: 'buy', availableQuantity: 3, estimatedAmount: 30000, price: 10000 })
})

it('실행이 경로·requestId를 전달하고 서버 orderId를 그대로 돌려준다', async () => {
  let body: unknown
  server.use(http.post(orderPath, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json({ orderNo: 'ORD-9', acceptedAt: '2026-10-27T00:00:00Z' })
  }))
  const res = await executeOrder({ requestId: 'req-1', accountId: 'a/b', productCode: '01', code: '005930', side: 'buy', quantity: 1, price: 10000 })
  expect(body).toMatchObject({ requestId: 'req-1', code: '005930', side: 'buy', orderType: 'ioc', quantity: 1 })
  expect(res).toEqual({ success: true, orderId: 'ORD-9' })
})

it('400은 서버 코드를, 404·409·502는 고정 코드를 돌려준다', async () => {
  server.use(http.post(orderPath, () => HttpResponse.json({ error: 'x', code: 'EXCEEDS_AVAILABLE_QTY' }, { status: 400 })))
  await expect(executeOrder({ requestId: 'r', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy', quantity: 1 })).resolves.toMatchObject({ success: false, failureCode: 'EXCEEDS_AVAILABLE_QTY' })
  server.use(http.post(orderPath, () => HttpResponse.json({ error: 'x' }, { status: 404 })))
  await expect(executeOrder({ requestId: 'r', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy', quantity: 1 })).resolves.toMatchObject({ success: false, failureCode: 'ACCOUNT_NOT_FOUND' })
  server.use(http.post(orderPath, () => HttpResponse.json({ error: 'x' }, { status: 409 })))
  await expect(executeOrder({ requestId: 'r', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy', quantity: 1 })).resolves.toMatchObject({ success: false, failureCode: 'ORDER_IN_PROGRESS' })
  server.use(http.post(orderPath, () => HttpResponse.json({ error: 'x', code: 'ORDER_CHECK_FAILED' }, { status: 502 })))
  await expect(executeOrder({ requestId: 'r', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy', quantity: 1 })).resolves.toMatchObject({ success: false, failureCode: 'ORDER_CHECK_FAILED' })
})

it('결과 불명(202)은 성공이 아니라 ORDER_UNKNOWN으로 매핑한다', async () => {
  server.use(http.post(orderPath, () => HttpResponse.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, { status: 202 })))
  await expect(executeOrder({ requestId: 'r', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy', quantity: 1 })).resolves.toEqual({ success: false, failureCode: 'ORDER_UNKNOWN', message: '주문 상태를 알 수 없습니다. 같은 요청으로 다시 확인하세요.' })
})

it('네트워크 실패는 UNKNOWN으로 돌려주고 같은 requestId로 재시도한다', async () => {
  const seen: unknown[] = []
  server.use(http.post(orderPath, async ({ request }) => {
    const body = (await request.json()) as { requestId?: string }
    seen.push(body.requestId)
    return HttpResponse.error()
  }))
  const input = { requestId: 'req-same', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy' as const, quantity: 1 }
  await expect(executeOrder(input)).resolves.toMatchObject({ success: false, failureCode: 'UNKNOWN' })
  await expect(executeOrder(input)).resolves.toMatchObject({ success: false, failureCode: 'UNKNOWN' })
  expect(seen).toEqual(['req-same', 'req-same'])
})

it('가짜 값을 쓰지 않는다(고정 가격·난수 주문 번호 없음)', async () => {
  server.use(http.post(checkPath, () => HttpResponse.json({ availableQty: 0, availableWon: 0 })))
  const checked = await checkPreOrder({ accountId: 'a/b', productCode: '01', code: 'c', side: 'buy', quantity: 2 })
  expect(checked.estimatedAmount).toBe(0)
  expect(checked.price).toBe(0)
  server.use(http.post(orderPath, () => HttpResponse.json({ orderNo: 'ORD-FIXED', acceptedAt: 't' })))
  const input = { requestId: 'r', accountId: 'a/b', productCode: '01', code: 'c', side: 'buy' as const, quantity: 1 }
  const first = await executeOrder(input)
  const second = await executeOrder({ ...input })
  expect(first.orderId).toBe('ORD-FIXED')
  expect(second.orderId).toBe('ORD-FIXED')
})
