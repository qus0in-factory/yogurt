import type { Context } from 'hono'
import { KisApiError } from '../kis/kis-stock-balance.ts'
import { checkBuyable, checkSellable, type CheckStage, CheckStageError } from '../kis/kis-order-check.ts'
import { fetchBestQuotes } from '../kis/kis-quotes.ts'
import { fetchDailyCcld, findOrderRow, type CcldRow } from '../kis/kis-order-status.ts'
import { classifyFill } from '../../domain/trading/order-fill.ts'
import type { KisAccountClient } from '../kis/kis-stock-balance.ts'
import { checkSchema, checkedProduct, kstDayString, marketClosed } from './order-contracts.ts'
import { findClaimByOrder, releaseClaimed } from './order-idempotency.ts'
import { ORDER_REJECTION } from '../../domain/trading/order-codes.ts'

export type Ctx = Context<{ Bindings: Env }>
export type Resolve = (c: Ctx, id: string) => Promise<KisAccountClient | null>

export async function checkOrderRequest(c: Ctx, resolve: Resolve) {
  const parsed = checkSchema.safeParse(await c.req.json())
  const productCode = parsed.success ? await checkedProduct(c) : null
  if (!parsed.success || !productCode) {
    // 어느 필드가 틀렸는지만 reason에 넣는다(코드·경로만, 값 제외).
    const reason = !parsed.success ? parsed.error.issues.map((i) => `${i.code === 'custom' && /^[A-Z_]+$/.test(i.message) ? i.message : i.code}:${i.path.join('.') || 'body'}`).join(',') : 'INVALID_PRODUCT'
    console.info(JSON.stringify({ kind: 'check-diag', stage: 'validate', status: null, kisCode: null, kisMessage: null, reason }))
    return c.json({ error: 'invalid request', code: ORDER_REJECTION.INVALID_ORDER_CHECK, reason }, 400)
  }
  const closed = marketClosed()
  if (closed) return c.json(closed, 400)
  const account = await resolve(c, c.req.param('accountId') ?? '')
  if (!account) return c.json({ error: 'account not found', code: ORDER_REJECTION.ACCOUNT_NOT_FOUND }, 404)
  const { code, side, price, quantity } = parsed.data
  try {
    if (side === 'buy') {
      const result = await checkBuyable(account, productCode, code, price ?? 0)
      if (result.availableQty < quantity) {
        return c.json({ error: 'exceeds available quantity', code: ORDER_REJECTION.ORDER_QUANTITY_EXCEEDED, availableQty: result.availableQty, requestedQty: quantity }, 400)
      }
      return c.json(result, 200)
    }
    // 매도 확인도 매수와 같은 계약({availableQty, availableWon})으로 맞춘다.
    const sellable = await checkSellable(account, productCode, code)
    if (sellable.availableQty < quantity) {
      return c.json({ error: 'exceeds available quantity', code: ORDER_REJECTION.ORDER_QUANTITY_EXCEEDED, availableQty: sellable.availableQty, requestedQty: quantity }, 400)
    }
    const quotes = await fetchBestQuotes(account, productCode, code)
    return c.json({ availableQty: sellable.availableQty, availableWon: sellable.availableQty * quotes.bid1 }, 200)
  } catch (error) {
    // 단계·상태·KIS 코드를 응답과 로그에 함께 남긴다. 값·토큰·계좌번호는 넣지 않는다.
    const stage: CheckStage | 'quote' = error instanceof CheckStageError ? error.stage : 'quote'
    if (error instanceof KisApiError) {
      const status = error instanceof CheckStageError ? error.status : null
      console.info(JSON.stringify({ kind: 'check-diag', stage, status, kisCode: error.code, kisMessage: error.message }))
      return c.json({ error: 'order check failed', code: 'ORDER_CHECK_FAILED', stage, kisCode: error.code, kisMessage: error.message }, 502)
    }
    throw error
  }
}

export async function checkOrderStatus(c: Ctx, resolve: Resolve) {
  const productCode = await checkedProduct(c)
  if (!productCode) return c.json({ error: 'invalid request', code: ORDER_REJECTION.INVALID_ORDER }, 400)
  const account = await resolve(c, c.req.param('accountId') ?? '')
  if (!account) return c.json({ error: 'account not found', code: ORDER_REJECTION.ACCOUNT_NOT_FOUND }, 404)
  const accountId = c.req.param('accountId') ?? ''
  const orderId = c.req.param('orderId') ?? ''
  if (!c.env.DB) return c.json({ error: 'order storage unavailable', code: 'ORDER_STORAGE_UNAVAILABLE' }, 503)
  const claim = await findClaimByOrder(c.env.DB, accountId, productCode, orderId)
  if (!claim) return c.json({ error: 'order not found', code: ORDER_REJECTION.ORDER_NOT_FOUND }, 404)
  const day = kstDayString(Date.now())
  let rows: CcldRow[]
  try {
    rows = await fetchDailyCcld(account, productCode, '', day, day)
  } catch {
    return c.json({ error: 'order status unavailable', code: 'ORDER_STATUS_UNAVAILABLE' }, 503)
  }
  const row = findOrderRow(rows, orderId)
  const status = classifyFill(row ? { orderedQty: row.orderedQty, filledQty: row.filledQty, remainingQty: row.remainingQty, cancelled: row.cancelled } : null)
  return c.json({
    orderId, status,
    orderedQty: row?.orderedQty ?? 0, filledQty: row?.filledQty ?? 0, remainingQty: row?.remainingQty ?? 0,
    checkedAt: new Date().toISOString(),
  }, 200)
}
