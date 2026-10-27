import { HTTPError } from 'ky'
import { api } from '../http/http'
import { checkResponseSchema, newRequestId, orderPath, orderResponseSchema, toFailure, withHttpErrorData } from './order-protocol'

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
  success: boolean; orderId?: string; failureCode?: string; message?: string; reason?: string; nextOpenAt?: string
}

// 서버 응답 {availableQty, availableWon} → 화면 형태. price는 입력값 그대로 쓴다.
export async function checkPreOrder(input: PreOrderCheckInput): Promise<PreOrderCheckOutput> {
  const priced = Number.isInteger(input.price) && (input.price as number) > 0 ? { price: input.price } : {} // 양의 정수일 때만 전송
  try {
    const raw = await api.post(orderPath(input.accountId, input.productCode, 'check'), {
      json: { requestId: newRequestId(), code: input.code, side: input.side, orderType: 'ioc', quantity: input.quantity, ...priced },
      retry: 0,
    }).json()
    const parsed = checkResponseSchema.parse(raw)
    return {
      code: input.code, side: input.side,
      availableQuantity: parsed.availableQty, estimatedAmount: parsed.availableWon, price: input.price ?? 0,
    }
  } catch (error) {
    throw await withHttpErrorData(error)
  }
}

// requestId는 화면이 확인 버튼을 누를 때 한 번 만든 값을 재시도에도 그대로 쓴다.
export async function executeOrder(input: OrderExecutionInput): Promise<OrderExecutionOutput> {
  let raw: unknown
  try {
    raw = await api.post(orderPath(input.accountId, input.productCode, ''), {
      json: {
        requestId: input.requestId, code: input.code, side: input.side, orderType: 'ioc',
        quantity: input.quantity, checkAt: new Date().toISOString(), checkQty: input.quantity,
        productCode: input.productCode, ...(input.price === undefined ? {} : { price: input.price }),
      },
      retry: 0,
    }).json()
  } catch (error) {
    if (error instanceof HTTPError) {
      return { success: false, ...toFailure(error.response.status, (error as { data?: unknown }).data) } // ky 선파싱 바디 사용(바디 소진)
    }
    return { success: false, failureCode: 'UNKNOWN', message: '주문 상태를 알 수 없습니다. 같은 화면에서 같은 요청으로만 확인하세요.' }
  }
  const parsed = orderResponseSchema.safeParse(raw)
  if (!parsed.success) {
    if (typeof raw === 'object' && raw !== null && (raw as { code?: unknown }).code === 'ORDER_UNKNOWN') {
      return { success: false, failureCode: 'ORDER_UNKNOWN', message: '주문 상태를 알 수 없습니다. 같은 요청으로 다시 확인하세요.' }
    }
    return { success: false, failureCode: 'UNKNOWN', message: '주문 응답을 확인할 수 없습니다.' }
  }
  return { success: true, orderId: parsed.data.orderNo }
}
