import type { RebalanceInput, RebalanceItem, RebalanceOrder, RebalancePlan, RebalanceWarning } from './types.ts'
import { heldQuantity, isStockTarget, makeOrder, priceOf, roundedDifference } from './helpers.ts'
export function buildRebalancePlan(input: RebalanceInput): RebalancePlan {
  const { holdings, cash, targets, prices, keepAmount } = input
  const sellableValue = (code: string) => holdings.find((h) => h.code === code)?.sellableQuantity
  const validSellable = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
  const sellable = (code: string) => { const value = sellableValue(code); return validSellable(value) ? value : 0 }
  const sellableWarning = (code: string): RebalanceItem['sellableWarning'] => { const value = sellableValue(code); return validSellable(value) ? (value === 0 ? 'zero' : undefined) : 'missing' }
  const mode = input.mode ?? 'diff'
  const evaluation = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0)
  const total = evaluation + cash
  if (keepAmount >= total) {
    return { orders: [], items: [], leftoverCash: 0, warnings: [{ code: null, reason: 'KEEP_NOT_BELOW_TOTAL' }] }
  }
  const investable = total - keepAmount
  const warnings: RebalanceWarning[] = []
  const warn = (code: string, warning: 'missing' | 'zero') => warnings.push({ code, reason: 'NO_SELLABLE', sellableQuantity: warning === 'zero' ? 0 : null })
  const stockTargets = targets.filter(isStockTarget)
  const targetsByCode = new Map(stockTargets.map((target) => [target.code, target]))
  const sells: RebalanceOrder[] = []
  const buys: RebalanceOrder[] = []
  const targetItems: RebalanceItem[] = []
  const extraItems: RebalanceItem[] = []

  for (const holding of holdings) {
    if (targetsByCode.has(holding.code)) continue
    const price = priceOf(prices, holding.code)
    if (price === null) {
      warnings.push({ code: holding.code, reason: 'NO_PRICE' })
      continue
    }
    if (holding.quantity > 0) {
      const warning = sellableWarning(holding.code)
      if (warning) warn(holding.code, warning)
      const quantity = Math.min(holding.quantity, sellable(holding.code))
      if (quantity > 0) sells.push(makeOrder('sell', holding.code, holding.name, quantity, price))
      extraItems.push({
        code: holding.code, name: holding.name, targetQuantity: 0,
        currentQuantity: holding.quantity, orderQuantity: quantity, side: quantity > 0 ? 'sell' : 'none',
        ...(warning ? { sellableWarning: warning } : {}),
      })
    }
  }

  for (const target of stockTargets) {
    const price = priceOf(prices, target.code)
    if (price === null) {
      warnings.push({ code: target.code, reason: 'NO_PRICE' })
      continue
    }
    const held = heldQuantity(holdings, target.code)
    const desiredQuantity = investable * target.weightBps / 10000 / price
    let difference = mode === 'full'
      ? Math.floor(desiredQuantity) - held : roundedDifference(desiredQuantity, held)
    const targetQuantity = held + difference
    let warning: RebalanceItem['sellableWarning']
    if (difference < 0) { warning = sellableWarning(target.code); if (warning) warn(target.code, warning); difference = -Math.min(-difference, sellable(target.code)) }
    const side: RebalanceItem['side'] = difference > 0 ? 'buy' : difference < 0 ? 'sell' : 'none'
    const item: RebalanceItem = {
      code: target.code, name: target.name, targetQuantity,
      currentQuantity: held, orderQuantity: Math.abs(difference), side,
      ...(warning ? { sellableWarning: warning } : {}),
    }
    targetItems.push(item)
    if (mode === 'full') {
      if (held > 0 && sellable(target.code) > 0) sells.push(makeOrder('sell', target.code, target.name, Math.min(held, sellable(target.code)), price))
      if (targetQuantity > 0) buys.push(makeOrder('buy', target.code, target.name, targetQuantity, price))
      continue
    }
    if (difference > 0) buys.push(makeOrder('buy', target.code, target.name, difference, price))
    if (difference < 0) sells.push(makeOrder('sell', target.code, target.name, -difference, price))
  }

  const totalBuy = buys.reduce((sum, order) => sum + order.estimatedAmount, 0)
  const totalSell = sells.reduce((sum, order) => sum + order.estimatedAmount, 0)
  return {
    orders: [...sells, ...buys], items: [...targetItems, ...extraItems],
    leftoverCash: cash + totalSell - totalBuy, warnings,
  }
}
