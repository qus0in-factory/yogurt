import type { RiskClass } from './risk-class-client'

export const RISK_LIMIT_PERCENT = 70

type Holding = { code: string; evaluationAmount: number }

export function riskRatio(holdings: Holding[], cash: number, classes: Record<string, RiskClass>) {
  const total = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0) + cash
  const riskAmount = holdings.reduce(
    (sum, holding) => classes[holding.code] === 'safe' ? sum : sum + holding.evaluationAmount,
    0,
  )
  const rawRatio = total === 0 ? 0 : riskAmount / total * 100
  const ratio = Math.round(rawRatio * 100) / 100
  return { riskAmount, total, ratio, exceeds: rawRatio > RISK_LIMIT_PERCENT }
}
