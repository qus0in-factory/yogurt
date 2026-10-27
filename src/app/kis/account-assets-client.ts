import { z } from 'zod'
import { api } from '../http/http'

const rowSchema = z.object({
  index: z.number(), purchaseAmount: z.number(), evaluationAmount: z.number(), profitLoss: z.number(),
  creditLoan: z.number(), netAssets: z.number(), weight: z.number(),
})
const summarySchema = z.object({
  totalAssets: z.number(), netAssets: z.number(), evaluationAmount: z.number(), purchaseAmount: z.number(),
  profitLoss: z.number(), loanAmount: z.number(), deposit: z.number(), totalDeposit: z.number(),
  cmaEvaluation: z.number(), foreignEvaluation: z.number(),
})
const assetsSchema = z.object({ rows: rowSchema.array(), summary: summarySchema })
const balanceSchema = z.object({
  summary: z.object({
    cash: z.number(), cashD2: z.number().optional(), cashD2Fallback: z.boolean().optional(),
    stockEvaluation: z.number(), totalEvaluation: z.number(), netAssets: z.number(),
    purchaseAmount: z.number(), evaluationAmount: z.number(), profitLoss: z.number(),
    assetChange: z.number(), assetChangeRate: z.number(),
  }),
  holdings: z.object({
    code: z.string(), name: z.string(), quantity: z.number(), averagePrice: z.number(),
    purchaseAmount: z.number(), currentPrice: z.number(), evaluationAmount: z.number(),
    profitLoss: z.number(), profitLossRate: z.number(),
  }).array(),
})
export type AccountAssets = z.infer<typeof assetsSchema>
export type ProductBalance = z.infer<typeof balanceSchema>

const productPath = (accountId: string, code: string) =>
  `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(code)}`

export async function getAccountAssets(accountId: string, code: string): Promise<AccountAssets> {
  return assetsSchema.parse(await api.get(`${productPath(accountId, code)}/assets`).json())
}

export async function getProductBalance(accountId: string, code: string, signal?: AbortSignal): Promise<ProductBalance> {
  return balanceSchema.parse(await api.get(`${productPath(accountId, code)}/balance`, { signal, retry: 0 }).json())
}
