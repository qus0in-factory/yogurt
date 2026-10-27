import type { Context } from 'hono'
import { checkBuyable, checkSellable } from '../kis/kis-order-check.ts'
import { placeSingleOrder, toOrderFailure, type SingleOrderInput } from '../kis/kis-order.ts'
import type { KisAccountClient } from '../kis/kis-stock-balance.ts'
import { expectedPrice, fetchBestQuotes } from '../kis/kis-quotes.ts'
import { CHECK_FRESH_MS, checkedProduct, logOrder, marketClosed, orderSchema } from './order-contracts.ts'
import { claimOrder, markSending, markSucceeded, releaseClaimed, releaseSettled, safeMarkUnknown } from './order-idempotency.ts'
import { ORDER_REJECTION } from '../../domain/trading/order-codes.ts'

export type Ctx = Context<{ Bindings: Env }>
export type Resolve = (c: Ctx, id: string) => Promise<KisAccountClient | null>

export async function executeOrderRequest(c: Ctx, resolve: Resolve) {
  const parsed = orderSchema.safeParse(await c.req.json())
  const productCode = parsed.success ? await checkedProduct(c, parsed.data.productCode) : null
  if (!parsed.success || !productCode) return c.json({ error: 'invalid request', code: ORDER_REJECTION.INVALID_ORDER }, 400)
  const closed = marketClosed(); if (closed) return c.json(closed, 400)
  if (!c.env.DB) return c.json({ error: 'order storage unavailable', code: 'ORDER_STORAGE_UNAVAILABLE' }, 503)
  const { requestId, code, quantity, side, orderType, price, checkAt, checkQty } = parsed.data
  if (checkQty < quantity) return c.json({ error: 'exceeds checked quantity', code: ORDER_REJECTION.EXCEEDS_CHECKED_QTY }, 400)
  if (Date.now() - Date.parse(checkAt) > CHECK_FRESH_MS) return c.json({ error: 'stale check', code: ORDER_REJECTION.STALE_CHECK }, 400)
  const accountId = c.req.param('accountId') ?? '', claimId = `${accountId}:${productCode}:${requestId}`
  const claim = await claimOrder(c.env.DB, claimId)
  if (claim.outcome === 'done') return c.json({ orderNo: claim.orderNo, acceptedAt: claim.acceptedAt }, 200)
  if (claim.outcome === 'unknown') return c.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, 202)
  if (claim.outcome === 'processing') return c.json({ error: 'duplicate request', code: 'DUPLICATE_REQUEST' }, 409)
  const account = await resolve(c, c.req.param('accountId') ?? '')
  if (!account) { await releaseClaimed(c.env.DB, claimId); return c.json({ error: 'account not found', code: ORDER_REJECTION.ACCOUNT_NOT_FOUND }, 404) }
  const input: SingleOrderInput = { account, productCode, code, quantity, side, orderType, price }
  let expected: number | null
  try {
    const fresh = side === 'buy' ? await checkBuyable(account, productCode, code, price ?? 0) : await checkSellable(account, productCode, code)
    if (fresh.availableQty < quantity) {
      await releaseClaimed(c.env.DB, claimId); return c.json({ error: 'exceeds available quantity', code: ORDER_REJECTION.EXCEEDS_AVAILABLE_QTY }, 400)
    }
    expected = expectedPrice(side, await fetchBestQuotes(account, productCode, code))
    if (expected === null) {
      await releaseClaimed(c.env.DB, claimId); return c.json({ error: 'no quote available', code: ORDER_REJECTION.NO_QUOTE }, 400)
    }
  } catch {
    await releaseClaimed(c.env.DB, claimId); return c.json({ error: 'order check failed', code: 'ORDER_CHECK_FAILED' }, 502)
  }
  try {
    if (!(await markSending(c.env.DB, claimId))) return c.json({ error: 'duplicate request', code: 'DUPLICATE_REQUEST' }, 409)
  } catch {
    return c.json({ error: 'order storage unavailable', code: 'ORDER_STORAGE_UNAVAILABLE' }, 503)
  }
  let result: { orderNo: string; acceptedAt: string }
  try {
    result = await placeSingleOrder(input)
  } catch (error) {
    const failure = toOrderFailure(error); logOrder(requestId, code, quantity, side, failure)
    if (failure === 'UNKNOWN') {
      await safeMarkUnknown(c.env.DB, claimId); return c.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, 202)
    }
    await releaseSettled(c.env.DB, claimId)
    return c.json({ error: 'order failed', code: failure }, failure === 'MARKET_CLOSED' ? 503 : 400)
  }
  try {
    if (await markSucceeded(c.env.DB, claimId, result.orderNo, result.acceptedAt, accountId, productCode)) {
      logOrder(requestId, code, quantity, side, 'accepted'); return c.json({ ...result, expectedPrice: expected }, 200)
    }
    await safeMarkUnknown(c.env.DB, claimId)
  } catch {
    await safeMarkUnknown(c.env.DB, claimId)
  }
  return c.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, 202)
}
