import { isIsoDate } from '../shared/calendar'
import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isIsoDate)

const amountWon = z.number().int().min(0).refine(Number.isSafeInteger)
const nullableAmountWon = z.union([amountWon, z.null()])

const validRange = (plan: { minTargetAmountWon: number | null; maxTargetAmountWon: number | null }) =>
  plan.minTargetAmountWon === null || plan.maxTargetAmountWon === null || plan.minTargetAmountWon <= plan.maxTargetAmountWon

export const productPlanSchema = z.object({
  startDate: isoDate,
  minTargetAmountWon: nullableAmountWon,
  maxTargetAmountWon: nullableAmountWon,
}).refine(validRange)

export const productPlanRequestSchema = z.object({
  startDate: z.union([isoDate, z.null()]),
  minTargetAmountWon: nullableAmountWon,
  maxTargetAmountWon: nullableAmountWon,
}).refine((plan) => (
  plan.startDate === null
    ? plan.minTargetAmountWon === null && plan.maxTargetAmountWon === null
    : validRange(plan)
))

export type ProductPlan = z.infer<typeof productPlanSchema>
export type ProductPlanRequest = z.infer<typeof productPlanRequestSchema>
