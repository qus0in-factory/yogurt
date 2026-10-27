import { Hono, type Context } from 'hono'
import { KisApiError } from '../kis/kis-stock-balance.ts'
import { checkBuyable, checkSellable } from '../kis/kis-order-check.ts'
import type { KisAccountClient } from '../kis/kis-stock-balance.ts'
import { checkSchema, checkedProduct, defaultResolve, type OrderCtx } from './order-contracts.ts'
import { claimOrder } from './order-idempotency.ts'
import { executeOrderRequest, type Resolve } from './order-handlers.ts'

type Ctx = Context<{ Bindings: Env }>
type Deps = { fetchFn?: typeof fetch; resolveAccount?: (c: Ctx, id: string) => Promise<KisAccountClient | null> }

export function createOrderRoutes(deps: Deps = {}) {
  const fetchFn = deps.fetchFn ?? fetch
  const resolve: Resolve = deps.resolveAccount ?? ((c: OrderCtx, id: string) => defaultResolve(c, id, fetchFn))
  const routes = new Hono<{ Bindings: Env }>()

  routes.post('/accounts/:accountId/products/:productCode/orders/check', async (c) => {
    const parsed = checkSchema.safeParse(await c.req.json())
    const productCode = parsed.success ? await checkedProduct(c) : null
    if (!parsed.success || !productCode) return c.json({ error: 'invalid request', code: 'INVALID_ORDER_CHECK' }, 400)
    const account = await resolve(c, c.req.param('accountId'))
    if (!account) return c.json({ error: 'account not found', code: 'ACCOUNT_NOT_FOUND' }, 404)
    try {
      const { code, side, orderType, price } = parsed.data
      const result = side === 'buy'
        ? await checkBuyable(account, productCode, code, price ?? 0)
        : await checkSellable(account, productCode, code)
      return c.json(result, 200)
    } catch (error) {
      if (error instanceof KisApiError) return c.json({ error: 'order check failed', code: 'ORDER_CHECK_FAILED' }, 502)
      throw error
    }
  })

  routes.post('/accounts/:accountId/products/:productCode/orders', (c) => executeOrderRequest(c, resolve))

  return routes
}

export const orderRoutes = createOrderRoutes()
