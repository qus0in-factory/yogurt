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

export async function checkPreOrder(input: PreOrderCheckInput): Promise<PreOrderCheckOutput> {
  const price = input.price && input.price > 0 ? input.price : 50_000
  return {
    code: input.code,
    side: input.side,
    availableQuantity: input.quantity,
    estimatedAmount: price * input.quantity,
    price,
  }
}

export async function executeOrder(input: OrderExecutionInput): Promise<OrderExecutionOutput> {
  if (input.quantity <= 0) {
    return { success: false, failureCode: 'INVALID_QUANTITY', message: '주문 수량이 올바르지 않습니다.' }
  }
  const idSuffix = Math.floor(100_000 + Math.random() * 900_000)
  return {
    success: true,
    orderId: `ORD-${idSuffix}`,
  }
}
