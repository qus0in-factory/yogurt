import type { RebalanceItem } from '../../../domain/rebalance/types'

const GROUP: Record<RebalanceItem['side'], number> = { sell: 0, buy: 1, none: 2 }

function estimatedAmount(item: RebalanceItem, prices: Record<string, number>): number {
  const price = prices[item.code]
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return 0
  return item.orderQuantity * price
}

// 표 표시 순서만 정한다. 계산 결과의 의미와 주문 목록은 바꾸지 않는다.
export function sortRebalanceRows(items: RebalanceItem[], prices: Record<string, number>): RebalanceItem[] {
  return [...items].sort((a, b) => {
    const group = GROUP[a.side] - GROUP[b.side]
    if (group !== 0) return group
    const amount = estimatedAmount(b, prices) - estimatedAmount(a, prices)
    if (amount !== 0) return amount
    return a.code < b.code ? -1 : a.code > b.code ? 1 : 0
  })
}
