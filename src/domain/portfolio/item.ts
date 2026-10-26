import { z } from 'zod'

export const CASH_ITEM_NAME = '현금/예수금'
export const STOCK_CODE_PATTERN = /^[A-Z0-9._-]{1,20}$/

export const portfolioItemSchema = z.object({
  kind: z.enum(['security', 'cash']),
  stockCode: z.string().trim().toUpperCase().nullable(),
  stockName: z.string().trim().min(1, { error: 'REQUIRED' }).max(80, { error: 'INVALID_NAME' }),
  targetWeightBps: z.number().int({ error: 'INVALID_WEIGHT' }).min(1, { error: 'INVALID_WEIGHT' }).max(10000, { error: 'INVALID_WEIGHT' }),
}).strict().superRefine((item, ctx) => {
  if (item.kind === 'security') {
    if (!item.stockCode || !STOCK_CODE_PATTERN.test(item.stockCode)) {
      ctx.addIssue({ code: 'custom', path: ['stockCode'], message: 'INVALID_STOCK_CODE' })
    }
    return
  }
  if (item.stockCode !== null) {
    ctx.addIssue({ code: 'custom', path: ['stockCode'], message: 'INVALID_STOCK_CODE' })
  }
  if (item.stockName !== CASH_ITEM_NAME) {
    ctx.addIssue({ code: 'custom', path: ['stockName'], message: 'INVALID_STOCK_NAME' })
  }
})

export type PortfolioItem = z.infer<typeof portfolioItemSchema>
