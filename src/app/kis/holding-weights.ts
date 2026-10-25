export function withWeights<T extends { evaluationAmount: number }>(holdings: T[], cash = 0) {
  const total = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0) + cash
  const percent = (amount: number) => total === 0 ? 0 : Math.round(amount / total * 10000) / 100
  return {
    holdings: holdings.map((holding) => ({ ...holding, weight: percent(holding.evaluationAmount) })),
    cashWeight: percent(cash),
  }
}
