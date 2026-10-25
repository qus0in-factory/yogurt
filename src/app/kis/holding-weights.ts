export function withWeights<T extends { evaluationAmount: number }>(holdings: T[]): (T & { weight: number })[] {
  const total = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0)
  return holdings.map((holding) => ({
    ...holding,
    weight: total === 0 ? 0 : Math.round(holding.evaluationAmount / total * 10000) / 100,
  }))
}
