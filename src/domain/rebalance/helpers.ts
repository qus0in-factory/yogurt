import type { RebalanceHolding, RebalanceOrder, RebalanceStockTarget, RebalanceTarget } from './types.ts'

export const isStockTarget = (target: RebalanceTarget): target is RebalanceStockTarget =>
  target.kind === 'stock'

export const priceOf = (prices: Record<string, number>, code: string): number | null => {
  const price = prices[code]
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null
}

export const makeOrder = (
  side: RebalanceOrder['side'], code: string, name: string, quantity: number, price: number,
): RebalanceOrder => ({ side, code, name, quantity, price, estimatedAmount: price * quantity })

export const heldQuantity = (holdings: RebalanceHolding[], code: string) =>
  holdings.find((holding) => holding.code === code)?.quantity ?? 0

export const roundedDifference = (target: number, held: number): number =>
  target >= held ? Math.floor(target - held) : -Math.min(held, Math.ceil(held - target))
