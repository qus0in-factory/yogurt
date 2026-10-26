import type { Context } from 'hono'
import { KisApiError } from '../kis/kis-stock-balance.ts'
import { checkBuyable, checkSellable } from '../kis/kis-order-check.ts'
import { placeSingleOrder, toOrderFailure, type SingleOrderInput } from '../kis/kis-order.ts'
import type { KisAccountClient } from '../kis/kis-stock-balance.ts'
import { expectedPrice, fetchBestQuotes } from '../kis/kis-quotes.ts'
import { CHECK_FRESH_MS, checkedProduct, logOrder, orderSchema } from './order-contracts.ts'
import { claimOrder, markSending, markSucceeded, markUnknown, releaseClaimed, releaseSettled } from './order-idempotency.ts'

type Ctx = Context<{ Bindings: Env }>
export type Resolve = (c: Ctx, id: string) => Promise<KisAccountClient | null>

// claimed → sending → succeeded | unknown. failed(KIS 거부 확정)는 해제 후 재시도 허용.
// sending 이후에는 해제하지 않는다. TOCTOU(재조회-주문 사이 수량 변화)는 KIS 최종 검증에 맡긴다.
export async function executeOrderRequest(c: Ctx, resolve: Resolve) {
  const parsed = orderSchema.safeParse(await c.req.json())
  const productCode = parsed.success ? await checkedProduct(c, parsed.data.productCode) : null
  if (!parsed.success || !productCode) return c.json({ error: 'invalid request', code: 'INVALID_ORDER' }, 400)
  if (!c.env.DB) return c.json({ error: 'order storage unavailable', code: 'ORDER_STORAGE_UNAVAILABLE' }, 503)
  const { requestId, code, quantity, side, orderType, price, checkAt, checkQty } = parsed.data
  if (checkQty < quantity) return c.json({ error: 'exceeds checked quantity', code: 'EXCEEDS_CHECKED_QTY' }, 400)
  if (Date.now() - Date.parse(checkAt) > CHECK_FRESH_MS) return c.json({ error: 'stale check', code: 'STALE_CHECK' }, 400)
  const claim = await claimOrder(c.env.DB, requestId)
  if (claim.outcome === 'done') return c.json({ orderNo: claim.orderNo, acceptedAt: claim.acceptedAt }, 200)
  if (claim.outcome === 'unknown') return c.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, 200)
  if (claim.outcome === 'processing') return c.json({ error: 'duplicate request', code: 'DUPLICATE_REQUEST' }, 409)
  const account = await resolve(c, c.req.param('accountId') ?? '')
  if (!account) { await releaseClaimed(c.env.DB, requestId); return c.json({ error: 'account not found', code: 'ACCOUNT_NOT_FOUND' }, 404) }
  const input: SingleOrderInput = { account, productCode, code, quantity, side, orderType, price }
  // 재조회·호가 검증을 모두 통과한 뒤에만 sending으로 바꾼다. 그 전까지는 claimed 유지.
  let expected: number | null
  try {
    const fresh = side === 'buy'
      ? await checkBuyable(account, productCode, code, price ?? 0)
      : await checkSellable(account, productCode, code)
    if (fresh.availableQty < quantity) {
      await releaseClaimed(c.env.DB, requestId)
      return c.json({ error: 'exceeds available quantity', code: 'EXCEEDS_AVAILABLE_QTY' }, 400)
    }
    // 호가는 같은 단계에서 한 번만 조회한다. 없으면 주문하지 않고 해제한다.
    expected = expectedPrice(side, await fetchBestQuotes(account, productCode, code))
    if (expected === null) {
      await releaseClaimed(c.env.DB, requestId)
      return c.json({ error: 'no quote available', code: 'NO_QUOTE' }, 400)
    }
  } catch {
    await releaseClaimed(c.env.DB, requestId)
    return c.json({ error: 'order check failed', code: 'ORDER_CHECK_FAILED' }, 502)
  }
  try {
    if (!(await markSending(c.env.DB, requestId))) return c.json({ error: 'duplicate request', code: 'DUPLICATE_REQUEST' }, 409)
  } catch {
    return c.json({ error: 'order storage unavailable', code: 'ORDER_STORAGE_UNAVAILABLE' }, 503)
  }
  let result: { orderNo: string; acceptedAt: string }
  try {
    result = await placeSingleOrder(input)
  } catch (error) {
    const failure = toOrderFailure(error)
    logOrder(requestId, code, quantity, side, failure)
    if (failure === 'UNKNOWN') {
      try { await markUnknown(c.env.DB, requestId) } catch { /* best effort */ }
      return c.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, 502)
    }
    await releaseSettled(c.env.DB, requestId)
    return c.json({ error: 'order failed', code: failure }, failure === 'MARKET_CLOSED' ? 503 : 400)
  }
  try {
    if (await markSucceeded(c.env.DB, requestId, result.orderNo, result.acceptedAt)) {
      logOrder(requestId, code, quantity, side, 'accepted')
      return c.json({ ...result, expectedPrice: expected }, 200)
    }
    await markUnknown(c.env.DB, requestId)
  } catch {
    try { await markUnknown(c.env.DB, requestId) } catch { /* best effort */ }
  }
  return c.json({ error: 'order status unknown', code: 'ORDER_UNKNOWN' }, 502)
}
