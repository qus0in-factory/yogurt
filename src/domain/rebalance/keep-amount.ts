import { z } from 'zod'

export const keepAmountSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
export const keepAmountRequestSchema = z.object({ keepAmount: keepAmountSchema }).strict()
export const keepAmountResponseSchema = keepAmountRequestSchema
export const keepAmountProductCodeSchema = z.enum(['01', '22', '29'])
export type KeepAmountProductCode = z.infer<typeof keepAmountProductCodeSchema>
