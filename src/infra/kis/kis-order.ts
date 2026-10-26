import { KisApiError, type KisAccountClient } from './kis-stock-balance.ts'
import { IOC_ORDER_DVSN, mapKisFailure, splitAccount, type OrderFailureCode } from './kis-order-check.ts'

// 확인 필요: 현금주문 경로·TR_ID·hashkey 필요 여부·응답 주문번호 필드는 테스트베드에서 확정
export const ORDER_PATH = '/uapi/domestic-stock/v1/trading/order-cash'
export const BUY_ORDER_TR_ID = 'TTTC0802U'
export const SELL_ORDER_TR_ID = 'TTTC0801U'
// 확인 필요: 응답의 주문번호 필드명
const ORDER_NO_FIELD = 'ODNO'

export class KisOrderError extends Error {
  readonly failure: OrderFailureCode
  constructor(failure: OrderFailureCode) {
    super(`order failed: ${failure}`)
    this.name = 'KisOrderError'
    this.failure = failure
  }
}

export type SingleOrderInput = {
  account: KisAccountClient
  productCode: string
  code: string
  quantity: number
  side: 'buy' | 'sell'
  orderType: 'ioc'
  price?: number
}

// 한 호출에 한 종목 한 주문만 보낸다. 배열 인자를 받지 않는다.
// 매수·매도 모두 최유리 IOC. 지정가 가격 필드는 최유리 주문에서 0 (확인 필요).
export async function placeSingleOrder(input: SingleOrderInput): Promise<{ orderNo: string; acceptedAt: string }> {
  if (input.orderType !== 'ioc') {
    throw new KisOrderError('UNKNOWN')
  }
  const { cano, prdt } = splitAccount(input.account.accountNumber, input.productCode)
  const body = {
    CANO: cano, ACNT_PRDT_CD: prdt, PDNO: input.code,
    ORD_DVSN: IOC_ORDER_DVSN,
    ORD_QTY: String(input.quantity), ORD_UNPR: String(input.price ?? 0),
  }
  const hash = await input.account.hashkey?.(body)
  // 주문 POST는 자동 재시도 금지. 401이면 토큰만 갱신되고 주문은 실패로 끝난다.
  const response = await input.account.request(ORDER_PATH, {
    method: 'POST', trId: input.side === 'buy' ? BUY_ORDER_TR_ID : SELL_ORDER_TR_ID,
    body, headers: hash ? { hashkey: hash } : {}, retry: false,
  })
  let raw: { rt_cd?: string; msg_cd?: string; msg1?: string; output?: Record<string, unknown> }
  try {
    raw = (await response.json()) as typeof raw
  } catch {
    throw new KisOrderError('UNKNOWN')
  }
  if (raw.rt_cd !== '0') {
    throw new KisOrderError(mapKisFailure(raw.msg_cd ?? '', raw.msg1 ?? ''))
  }
  const orderNo = raw.output?.[ORDER_NO_FIELD]
  if (typeof orderNo !== 'string' || !orderNo) throw new KisOrderError('UNKNOWN')
  // 로그: 식별자·종목·수량·결과만. 계좌·토큰은 넣지 않는다.
  console.info(JSON.stringify({ kind: 'order', code: input.code, qty: input.quantity, side: input.side, result: 'accepted' }))
  return { orderNo, acceptedAt: new Date().toISOString() }
}

export function toOrderFailure(error: unknown): OrderFailureCode {
  if (error instanceof KisOrderError) return error.failure
  if (error instanceof KisApiError) return mapKisFailure(error.code, error.message)
  return 'UNKNOWN'
}
