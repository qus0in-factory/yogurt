import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { checkPreOrder, executeOrder } from '../../../src/app/trading/orders-client'
import { checkFailureData } from '../../../src/ui/operations/rebalance/rebalance-check-failure'

const server = setupServer()
const base = `${window.location.origin}/api`
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const checkPath = `${base}/accounts/a%2Fb/products/01/orders/check`
const orderPath = `${base}/accounts/a%2Fb/products/01/orders`
const input = { accountId: 'a/b', productCode: '01', code: '005930', side: 'buy' as const, quantity: 1, price: 10000 }

it('확인 실패 본문이 stage·kisCode로 전달된다', async () => {
  server.use(http.post(checkPath, () => HttpResponse.json({ code: 'ORDER_CHECK_FAILED', stage: 'buyable', kisCode: 'EGW00201', kisMessage: '초당' }, { status: 502 })))
  const err = await checkPreOrder(input).catch((e) => e)
  expect(checkFailureData(err)).toMatchObject({ stage: 'buyable', kisCode: 'EGW00201' })
})

it('실행 실패 본문 코드가 보인다(확정 거부 포함)', async () => {
  server.use(http.post(orderPath, () => HttpResponse.json({ code: 'RATE_LIMITED' }, { status: 400 })))
  await expect(executeOrder({ ...input, requestId: 'r' })).resolves.toMatchObject({ success: false, failureCode: 'RATE_LIMITED' })
  server.use(http.post(orderPath, () => HttpResponse.json({ code: 'ORDER_CHECK_FAILED', stage: 'sellable', kisCode: 'APBK0000' }, { status: 502 })))
  await expect(executeOrder({ ...input, requestId: 'r' })).resolves.toMatchObject({ success: false, failureCode: 'ORDER_CHECK_FAILED' })
})

it('본문이 JSON이 아니면 안전하게 일반 실패로 처리된다', async () => {
  server.use(http.post(orderPath, () => new HttpResponse('bad gateway', { status: 502 })))
  await expect(executeOrder({ ...input, requestId: 'r' })).resolves.toMatchObject({ success: false, failureCode: 'ORDER_UNAVAILABLE' })
  server.use(http.post(checkPath, () => new HttpResponse('bad gateway', { status: 502 })))
  const err = await checkPreOrder(input).catch((e) => e)
  expect(checkFailureData(err)).not.toMatchObject({ stage: expect.anything() })
})

it('가격 0·소수는 price 필드를 빼고 정상 정수는 넣는다', async () => {
  const bodies: unknown[] = []
  server.use(http.post(checkPath, async ({ request }) => {
    bodies.push(await request.json())
    return HttpResponse.json({ availableQty: 3, availableWon: 30000 })
  }))
  await checkPreOrder({ ...input, price: 0 })
  await checkPreOrder({ ...input, price: 10.5 })
  await checkPreOrder({ ...input, price: undefined })
  expect(bodies).toHaveLength(3)
  for (const body of bodies) expect(body).not.toHaveProperty('price')
  await checkPreOrder({ ...input, price: 10000 })
  expect(bodies[3]).toMatchObject({ price: 10000 })
})
