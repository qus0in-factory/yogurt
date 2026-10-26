import { z } from 'zod'
import { portfolioItemSchema } from './item.ts'
import { MAX_PORTFOLIO_ITEMS } from './limits.ts'

export const portfolioDraftSchema = z.object({
  name: z.string().trim().min(1, { error: 'REQUIRED' }).max(40, { error: 'INVALID_NAME' }),
  items: z.array(portfolioItemSchema).min(1, { error: 'REQUIRED' }).max(MAX_PORTFOLIO_ITEMS, { error: 'TOO_MANY_ITEMS' }),
}).strict().superRefine((draft, ctx) => {
  const total = draft.items.reduce((sum, item) => sum + item.targetWeightBps, 0)
  if (total !== 10000) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: 'TOTAL_NOT_100' })
  }
  const codes = new Set<string>()
  let cashCount = 0
  draft.items.forEach((item, index) => {
    if (item.kind === 'cash') {
      cashCount += 1
      if (cashCount > 1) ctx.addIssue({ code: 'custom', path: ['items', index], message: 'DUPLICATE_CASH' })
      return
    }
    if (!item.stockCode) return
    if (codes.has(item.stockCode)) {
      ctx.addIssue({ code: 'custom', path: ['items', index, 'stockCode'], message: 'DUPLICATE_STOCK' })
    }
    codes.add(item.stockCode)
  })
})

export const portfolioSchema = portfolioDraftSchema.extend({
  id: z.string().min(1, { error: 'REQUIRED' }),
  createdAt: z.string().min(1, { error: 'REQUIRED' }),
  updatedAt: z.string().min(1, { error: 'REQUIRED' }),
})

export type PortfolioDraft = z.infer<typeof portfolioDraftSchema>
export type Portfolio = z.infer<typeof portfolioSchema>
