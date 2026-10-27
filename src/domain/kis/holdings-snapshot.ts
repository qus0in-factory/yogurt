import { z } from 'zod'

export type Holding = {
  code: string
  name: string
  quantity: number
  sellableQuantity?: number | null
  averagePrice: number
  purchaseAmount: number
  currentPrice: number
  evaluationAmount: number
  profitLoss: number
  profitLossRate: number
}

export type StoredHoldings = {
  holdings: Holding[]
  stockEvaluationWon: number
  asOf: string
}

const AS_OF = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
const WEEK_MS = 7 * 86400000
const number = z.number().finite()
const holdingSchema = z.object({
  code: z.string(), name: z.string(), quantity: number, averagePrice: number,
  purchaseAmount: number, currentPrice: number, evaluationAmount: number,
  profitLoss: number, profitLossRate: number,
  sellableQuantity: z.number().int().min(0).nullable().optional(),
})
const storedSchema = z.object({
  holdings: z.array(holdingSchema).min(1),
  stockEvaluationWon: z.number().int().min(0),
  asOf: z.string().regex(AS_OF),
})

export function parseStoredHoldings(raw: string): StoredHoldings | null {
  try {
    const parsed = storedSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function isHoldingsFresh(asOf: string, now: Date): boolean {
  const saved = Date.parse(`${asOf.replace(' ', 'T')}:00+09:00`)
  if (!Number.isFinite(saved)) return false
  const age = now.getTime() - saved
  return age >= 0 && age <= WEEK_MS
}
