import { z } from 'zod'

export const riskClassSchema = z.enum(['risk', 'safe'])
export type RiskClass = z.infer<typeof riskClassSchema>

export const stockCodeSchema = z.string().regex(/^[0-9A-Z]{1,12}$/)

export const riskClassUpdateSchema = z.object({
  riskClass: riskClassSchema,
})
export type RiskClassUpdate = z.infer<typeof riskClassUpdateSchema>
