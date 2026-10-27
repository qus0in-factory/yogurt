import { z } from 'zod'
import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item'
const code = z.string().regex(STOCK_CODE_PATTERN)
export const rebalanceInputsSchema = z.object({
  holdings: z.array(z.object({ code, name: z.string(), quantity: z.number().nonnegative(), currentPrice: z.number().nonnegative() })),
  cash: z.number().nonnegative(),
  targets: z.array(z.object({ code: code.nullable(), name: z.string(), weightBps: z.number().int().min(1).max(10000), kind: z.enum(['security', 'cash']) })),
  prices: z.record(code, z.number().positive()),
  priceFailed: z.array(code),
  hasPortfolio: z.boolean(),
})
export type RebalanceInputs = z.infer<typeof rebalanceInputsSchema>
