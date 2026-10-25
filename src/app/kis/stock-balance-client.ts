import { z } from 'zod'
import { api } from '../http/http'

const summarySchema = z.object({
  cash: z.number(), stockEvaluation: z.number(), totalEvaluation: z.number(),
  netAssets: z.number(), purchaseAmount: z.number(), evaluationAmount: z.number(),
  profitLoss: z.number(), assetChange: z.number(), assetChangeRate: z.number(),
})
const holdingSchema = z.object({
  code: z.string(), name: z.string(), quantity: z.number(), averagePrice: z.number(),
  purchaseAmount: z.number(), currentPrice: z.number(), evaluationAmount: z.number(),
  profitLoss: z.number(), profitLossRate: z.number(),
})
const stockBalanceSchema = z.object({ summary: summarySchema, holdings: holdingSchema.array() })
export type StockBalance = z.infer<typeof stockBalanceSchema>

export async function getStockBalance(accountId: string, signal?: AbortSignal): Promise<StockBalance> {
  const path = `accounts/${encodeURIComponent(accountId)}/products/29/balance`
  return stockBalanceSchema.parse(await api.get(path, { signal, retry: 0 }).json())
}
