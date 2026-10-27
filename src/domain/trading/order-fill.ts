export type FillStatus = 'filled' | 'closed_partial' | 'partial' | 'open' | 'cancelled' | 'unknown' | 'not_found' | 'rate_limited'

export type FillNumbers = {
  orderedQty: number
  filledQty: number
  remainingQty: number
  cancelled: boolean
}

// 조회는 성공했지만 주문 번호를 못 찾은 신호(unknown 과 구분). 체결 수치는 0으로 둔다.
export const NOT_FOUND_FILL = { notFound: true, orderedQty: 0, filledQty: 0, remainingQty: 0, cancelled: false } as const

// 일시적 초당 제한(EGW00201 등) 신호(소진 후). 화면은 '잠시 후 다시 확인' 대상이다.
export const RATE_LIMITED_FILL = { rateLimited: true, orderedQty: 0, filledQty: 0, remainingQty: 0, cancelled: false } as const

// NOT_FOUND_FILL(주문 번호 미발견)·RATE_LIMITED_FILL(일시 제한) 또는 조회된 수치.
export type FillQuery = typeof NOT_FOUND_FILL | typeof RATE_LIMITED_FILL | FillNumbers

// filled(잔여 0, 체결=주문), closed_partial(잔여 0, 0<체결<주문),
// partial(잔여>0, 0<체결<주문), open(잔여>0, 체결 0), cancelled(잔여 0, 체결 0 또는 취소),
// null=조회 실패(unknown), 미발견=not_found, 일시 제한=rate_limited.
export function classifyFill(numbers: FillQuery | null): FillStatus {
  if (!numbers) return 'unknown'
  if ('notFound' in numbers) return 'not_found'
  if ('rateLimited' in numbers) return 'rate_limited'
  if (numbers.orderedQty > 0 && numbers.remainingQty <= 0) {
    if (numbers.filledQty >= numbers.orderedQty) return 'filled'
    return numbers.filledQty > 0 ? 'closed_partial' : 'cancelled'
  }
  if (numbers.cancelled) return 'cancelled'
  if (numbers.filledQty > 0) return 'partial'
  return 'open'
}
