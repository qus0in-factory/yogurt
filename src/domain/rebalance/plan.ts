import type {
  RebalanceInput, RebalanceItem, RebalanceOrder, RebalancePlan, RebalanceWarning,
} from './types.ts'
import { heldQuantity, isStockTarget, makeOrder, priceOf } from './helpers.ts'

export function buildRebalancePlan(input: RebalanceInput): RebalancePlan {
  const { holdings, cash, targets, prices, keepAmount } = input
  const mode = input.mode ?? 'diff'
  const evaluation = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0)
  const rawInvestable = evaluation + cash - keepAmount
  const investable = Math.max(0, rawInvestable)
  const warnings: RebalanceWarning[] = []
  if (rawInvestable < 0) warnings.push({ code: null, reason: 'NOT_INVESTABLE' })
  if (investable === 0) return { orders: [], items: [], leftoverCash: 0, warnings }

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
      sells.push(makeOrder('sell', holding.code, holding.name, holding.quantity, price))
      extraItems.push({
        code: holding.code, name: holding.name, targetQuantity: 0,
        currentQuantity: holding.quantity, orderQuantity: holding.quantity, side: 'sell',
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
    const targetQuantity = Math.floor(investable * target.weightBps / 10000 / price)
    const difference = targetQuantity - held
    const side: RebalanceItem['side'] = difference > 0 ? 'buy' : difference < 0 ? 'sell' : 'none'
    targetItems.push({
      code: target.code, name: target.name, targetQuantity,
      currentQuantity: held, orderQuantity: Math.abs(difference), side,
    })
    if (mode === 'full') {
      if (held > 0) sells.push(makeOrder('sell', target.code, target.name, held, price))
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
    leftoverCash: investable - totalBuy + totalSell, warnings,
  }
}
