import { Hono, type Context } from 'hono'
import type { KisAccountClient } from '../kis/kis-stock-balance.ts'
import { checkedProduct, defaultResolve, type OrderCtx } from './order-contracts.ts'
import { checkOrderRequest, checkOrderStatus, type Resolve } from './order-handlers.ts'
import { executeOrderRequest } from './order-execute.ts'
import { streamFillOrders, type StreamDeps } from './order-stream.ts'
import { fetchOpenOrders, findOpenOrder } from '../kis/kis-open-orders.ts'
import { fetchDailyCcld } from '../kis/kis-order-status.ts'
import { cancelOpenOrder } from '../kis/kis-order-cancel.ts'

type Ctx = Context<{ Bindings: Env }>
type Deps = {
  fetchFn?: typeof fetch
  resolveAccount?: (c: Ctx, id: string) => Promise<KisAccountClient | null>
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  intervalMs?: number
  maxMs?: number
}

export function createOrderRoutes(deps: Deps = {}) {
  // fetch는 요청 시점에 조회한다. 모듈 로드 시점에 캡처하면 테스트의 fetch 패치를 우회한다.
  const resolve: Resolve = deps.resolveAccount ?? ((c: OrderCtx, id: string) => defaultResolve(c, id, deps.fetchFn ?? globalThis.fetch))
  const streamDeps = { resolveAccount: resolve, sleep: deps.sleep, now: deps.now, intervalMs: deps.intervalMs, maxMs: deps.maxMs }
  const routes = new Hono<{ Bindings: Env }>()

  routes.post('/accounts/:accountId/products/:productCode/orders/check', (c) => checkOrderRequest(c, resolve))
  routes.post('/accounts/:accountId/products/:productCode/orders', (c) => executeOrderRequest(c, resolve))
  routes.get('/accounts/:accountId/products/:productCode/orders/daily', async (c) => {
    const product = await checkedProduct(c)
    if (!product) return c.json({ error: 'invalid product' }, 400)
    const account = await resolve(c, c.req.param('accountId') ?? '')
    if (!account) return c.json({ error: 'account not found' }, 404)
    try { return c.json(await fetchDailyCcld(account, product, '', undefined, undefined, undefined, undefined, true), 200) }
    catch { return c.json({ error: 'daily orders unavailable' }, 503) }
  })
  routes.get('/accounts/:accountId/products/:productCode/orders/open', async (c) => {
    const productCode = await checkedProduct(c)
    if (!productCode) return c.json({ ok: false, code: 'INVALID_ORDER', message: 'invalid request' }, 400)
    const account = await resolve(c, c.req.param('accountId') ?? '')
    if (!account) return c.json({ ok: false, code: 'ACCOUNT_NOT_FOUND', message: 'account not found' }, 404)
    try { return c.json({ orders: await fetchOpenOrders(account, productCode) }, 200) } catch (error) {
      return c.json({ ok: false, code: 'OPEN_ORDERS_FAILED', message: error instanceof Error ? error.message : 'open orders failed' }, 502)
    }
  })
  routes.post('/accounts/:accountId/products/:productCode/orders/:orderId/cancel', async (c) => {
    const productCode = await checkedProduct(c)
    if (!productCode) return c.json({ ok: false, code: 'INVALID_ORDER', message: 'invalid request' }, 400)
    const account = await resolve(c, c.req.param('accountId') ?? '')
    if (!account) return c.json({ ok: false, code: 'ACCOUNT_NOT_FOUND', message: 'account not found' }, 404)
    let body: unknown
    try { body = await c.req.json() } catch { body = null }
    const orgNo = typeof body === 'object' && body !== null && typeof (body as { orgNo?: unknown }).orgNo === 'string'
      ? (body as { orgNo: string }).orgNo.trim() : ''
    const orderId = c.req.param('orderId') ?? ''
    if (!orderId || !orgNo) return c.json({ ok: false, code: 'INVALID_CANCEL_REQUEST', message: 'orderId and orgNo are required' }, 400)
    try {
      const found = await findOpenOrder(account, productCode, orderId)
      if (!found) return c.json({ ok: false, code: 'ORDER_NOT_OPEN', message: 'order is not open' }, 404)
      if (!found.order.cancellable || orgNo !== found.order.orgNo) return c.json({ ok: false, code: 'INVALID_CANCEL_REQUEST', message: '원주문 정보 불일치' }, 400)
      const result = await cancelOpenOrder(account, productCode, { orderId: found.order.orderId, orgNo: found.order.orgNo, ordDvsn: found.ordDvsn })
      return c.json(result, result.ok ? 200 : 502)
    } catch (error) {
      return c.json({ ok: false, code: 'CANCEL_FAILED', message: error instanceof Error ? error.message : 'cancel failed' }, 502)
    }
  })
  routes.get('/accounts/:accountId/products/:productCode/orders/:orderId/status', (c) => checkOrderStatus(c, resolve))
  routes.get('/accounts/:accountId/products/:productCode/orders/stream', (c) => streamFillOrders(c, streamDeps))

  return routes
}

export const orderRoutes = createOrderRoutes()
