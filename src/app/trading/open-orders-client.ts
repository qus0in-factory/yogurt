import { z } from 'zod'
import { api } from '../http/http'

export type OpenOrder = {
  orderId: string; orgNo: string; code: string; name: string; side: 'buy' | 'sell'
  cancellable?: boolean; orderQty: number; filledQty: number; remainingQty: number; price: number; orderedAt: string
}
const orderSchema = z.object({
  orderId: z.string(), orgNo: z.string(), code: z.string(), name: z.string(), side: z.enum(['buy', 'sell']),
  cancellable: z.boolean().optional(), orderQty: z.number(), filledQty: z.number(), remainingQty: z.number(), price: z.number(), orderedAt: z.string(),
}).strict()
const listSchema = z.object({ orders: z.array(orderSchema) }).strict()
const cancelSchema = z.union([
  z.object({ ok: z.literal(true), cancelOrderId: z.string() }).strict(),
  z.object({ ok: z.literal(false), code: z.string(), message: z.string() }).strict(),
])
const path = (accountId: string, productCode: string) =>
  `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productCode)}/orders`

export async function fetchOpenOrders(accountId: string, productCode: string): Promise<OpenOrder[]> {
  return listSchema.parse(await api.get(`${path(accountId, productCode)}/open`, { retry: 0 }).json()).orders
}

export async function cancelOpenOrder(accountId: string, productCode: string, orderId: string, orgNo: string) {
  try {
    return cancelSchema.parse(await api.post(`${path(accountId, productCode)}/${encodeURIComponent(orderId)}/cancel`, { json: { orgNo }, retry: 0 }).json())
  } catch (error) {
    const parsed = cancelSchema.safeParse((error as { data?: unknown }).data)
    if (parsed.success) return parsed.data
    return { ok: false as const, code: 'CANCEL_FAILED', message: error instanceof Error ? error.message : '취소에 실패했습니다' }
  }
}
