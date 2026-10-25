import { z } from 'zod'
import { api } from '../http/http'

export const riskClassSchema = z.enum(['risk', 'safe'])
export type RiskClass = z.infer<typeof riskClassSchema>
const classesSchema = z.object({ classes: z.record(z.string(), riskClassSchema) })
const savedSchema = z.object({ stockCode: z.string(), riskClass: riskClassSchema })

function productPath(accountId: string, code: string) {
  return `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(code)}`
}

export async function getRiskClasses(accountId: string, code: string): Promise<Record<string, RiskClass>> {
  const path = `${productPath(accountId, code)}/risk-classes`
  return classesSchema.parse(await api.get(path).json()).classes
}

export async function setRiskClass(accountId: string, code: string, stockCode: string, riskClass: RiskClass) {
  const path = `${productPath(accountId, code)}/risk-classes/${encodeURIComponent(stockCode)}`
  return savedSchema.parse(await api.put(path, { json: { riskClass } }).json())
}
