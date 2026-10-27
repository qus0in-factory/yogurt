import type { Context } from 'hono'
import { z } from 'zod'
import { portfolioProductCodeSchema } from '../../domain/portfolio/assignment.ts'
import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item.ts'
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
  side: z.enum(['buy', 'sell']), ...pricedFields,
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

export function logOrder(requestId: string, code: string, quantity: number, side: string, result: string) {
  console.info(JSON.stringify({ kind: 'order-route', requestId, code, qty: quantity, side, result }))
}
