export function buyLimitCash(cashSettled: number, keepAmount: number): number {
  if (!Number.isFinite(cashSettled) || !Number.isFinite(keepAmount)) return 0
  return Math.max(0, cashSettled - keepAmount)
}

export function allowedBuyQuantity(plannedQty: number, buyLimit: number, price: number): number {
  if (!Number.isFinite(plannedQty) || plannedQty <= 0) return 0
  if (!Number.isFinite(buyLimit) || buyLimit <= 0) return 0
  if (!Number.isFinite(price) || price <= 0) return 0
  return Math.min(Math.floor(plannedQty), Math.floor(buyLimit / price))
}
