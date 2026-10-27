export type RebalanceMode = 'diff' | 'full'

export type RebalanceHolding = {
  code: string
  name: string
  quantity: number
  sellableQuantity?: number | null
  evaluationAmount: number
}

export type RebalanceStockTarget = {
  kind: 'stock'
  code: string
  name: string
  weightBps: number
}

export type RebalanceCashTarget = {
  kind: 'cash'
  code: null
  name: string
  weightBps: number
}

export type RebalanceTarget = RebalanceStockTarget | RebalanceCashTarget

export type RebalanceInput = {
  holdings: RebalanceHolding[]
  cash: number
  targets: RebalanceTarget[]
  prices: Record<string, number>
  keepAmount: number
  mode?: RebalanceMode
}

export type RebalanceOrder = {
  side: 'buy' | 'sell'
  code: string
  name: string
  quantity: number
  price: number
  estimatedAmount: number
}

export type RebalanceItem = {
  code: string
  name: string
  targetQuantity: number
  currentQuantity: number
  orderQuantity: number
  side: 'buy' | 'sell' | 'none'
  sellableWarning?: 'missing' | 'zero'
}

export type RebalanceWarning = {
  code: string | null
  reason: 'KEEP_NOT_BELOW_TOTAL' | 'NO_PRICE' | 'NO_SELLABLE'
  sellableQuantity?: number | null
}

export type RebalancePlan = {
  orders: RebalanceOrder[]
  items: RebalanceItem[]
  leftoverCash: number
  warnings: RebalanceWarning[]
}
