import { z } from 'zod'
import { api } from '../http/http'
const row = z.object({ orderNo: z.string().min(1), code: z.string().min(1), side: z.enum(['buy', 'sell']), orderedQty: z.number().int().nonnegative(), orderedAt: z.string().datetime({ offset: true }) })
export type DailyOrder = z.infer<typeof row>
export async function fetchDailyOrders(accountId: string, productCode: string): Promise<DailyOrder[]> {
  return z.array(row).parse(await api.get(`accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productCode)}/orders/daily`, { retry: 0 }).json())
}
