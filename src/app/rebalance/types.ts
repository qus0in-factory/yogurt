import type { RebalanceHolding, RebalanceTarget } from '../../domain/rebalance/types'

export type TargetAccountOption = {
  accountId: string
  productCode: '01' | '22'
  accountNumber: string
  owner?: string
  alias: string
  portfolioId: string
  portfolioName: string
}

export type RebalanceInputs = {
  holdings: RebalanceHolding[]
  cash: number
  targets: RebalanceTarget[]
  prices: Record<string, number>
  priceFailed: string[]
  hasPortfolio: boolean
}

export type PreOrderCheckInput = {
  accountId: string
  productCode: string
  code: string
  side: 'buy' | 'sell'
  quantity: number
  price?: number
}

export type PreOrderCheckOutput = {
  code: string
  side: 'buy' | 'sell'
  availableQuantity: number
  estimatedAmount: number
  price: number
}

export type OrderExecutionInput = {
  requestId: string
  accountId: string
  productCode: string
  code: string
  side: 'buy' | 'sell'
  quantity: number
  price?: number
}

export type OrderExecutionOutput = {
  success: boolean
  orderId?: string
  failureCode?: string
  message?: string
}
