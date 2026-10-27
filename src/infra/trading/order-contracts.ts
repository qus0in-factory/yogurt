import type { Context } from 'hono'
import { z } from 'zod'
import { portfolioProductCodeSchema } from '../../domain/portfolio/assignment.ts'
import { ORDER_REJECTION } from '../../domain/trading/order-codes.ts'
import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item.ts'
import { MARKET_HOLIDAYS } from '../../domain/market/holidays.ts'
import { isMarketOpen } from '../../domain/market/session.ts'
import { KisApiError, type KisAccountClient } from '../kis/kis-stock-balance.ts'
import { kisClientFromEnv } from '../kis/kis-context.ts'
import { checkBuyable, checkSellable } from '../kis/kis-order-check.ts'
import { placeSingleOrder, toOrderFailure, type SingleOrderInput } from '../kis/kis-order.ts'
import { targetExists } from '../portfolio/assignment-repository.ts'
import { claimOrder } from './order-idempotency.ts'

// 확인 필요: 확인 조회 결과의 유효 시간(5분)은 테스트베드 확정 전까지 고정
export const CHECK_FRESH_MS = 5 * 60 * 1000

export type OrderCtx = Context<{ Bindings: Env }>
export type ResolveAccount = (c: OrderCtx, id: string) => Promise<KisAccountClient | null>

function priceCheck(value: { orderType: 'ioc'; price?: number }, ctx: z.RefinementCtx) {
  if (value.orderType !== 'ioc') {
    ctx.addIssue({ code: 'custom', message: 'INVALID_ORDER_TYPE' })
  }
  if (value.price !== undefined && !(Number.isInteger(value.price) && value.price > 0)) {
    ctx.addIssue({ code: 'custom', message: 'INVALID_PRICE' })
  }
}

const pricedFields = {
  orderType: z.enum(['ioc']), price: z.number().int().positive().optional(),
}

export const checkSchema = z.object({
  requestId: z.string().min(1), code: z.string().regex(STOCK_CODE_PATTERN),
  side: z.enum(['buy', 'sell']), quantity: z.number().int().positive(), ...pricedFields,
}).strict().superRefine(priceCheck)

export const orderSchema = z.object({
  requestId: z.string().min(1), code: z.string().regex(STOCK_CODE_PATTERN),
  side: z.enum(['buy', 'sell']), ...pricedFields,
  quantity: z.number().int().positive(), checkAt: z.string().datetime(), checkQty: z.number().int().min(0),
  productCode: portfolioProductCodeSchema.optional(),
}).strict().superRefine(priceCheck)

export async function defaultResolve(c: OrderCtx, id: string, fetchFn: typeof fetch) {
  const client = kisClientFromEnv(c, fetchFn)
  return client ? client.forAccount(id) : null
}

export async function checkedProduct(c: OrderCtx, bodyCode?: string) {
  const pathCode = c.req.param('productCode')
  if (!portfolioProductCodeSchema.safeParse(pathCode).success) return null
  if (bodyCode !== undefined && bodyCode !== pathCode) return null
  const accountId = c.req.param('accountId') ?? ''
  if (!c.env.DB || !(await targetExists(c.env.DB, accountId, pathCode as '01' | '22'))) return null
  return pathCode as '01' | '22'
}

// KST(Asia/Seoul) 기준 일자(yyyymmdd). UTC 15:00 전후로 날짜가 바뀐다.
export function kstDayString(nowMs: number): string {
  return new Date(nowMs + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replaceAll('-', '')
}

// 서버 시각 기준. 닫혀 있으면 KIS 호출 없이 막는다.
export function marketClosed() {
  const status = isMarketOpen(new Date(), MARKET_HOLIDAYS)
  if (status.open) return null
  return { error: 'market closed', code: ORDER_REJECTION.MARKET_CLOSED, reason: status.reason, nextOpenAt: status.nextOpenAt }
}

export function logOrder(requestId: string, code: string, quantity: number, side: string, result: string) {
  console.info(JSON.stringify({ kind: 'order-route', requestId, code, qty: quantity, side, result }))
}
