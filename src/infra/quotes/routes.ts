import { Hono } from 'hono'
import { quoteHandler } from './handler'
import { rebalanceInputsHandler } from './inputs'
export function createQuoteRoutes(fetchFn: typeof fetch = fetch) {
  return new Hono<{ Bindings: Env }>()
    .get('/quotes/:code', c => quoteHandler(c, fetchFn))
    .get('/accounts/:id/products/:code/rebalance-inputs', c => rebalanceInputsHandler(c, fetchFn))
}
export const quoteRoutes = createQuoteRoutes()
