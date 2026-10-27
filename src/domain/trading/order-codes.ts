// 서버가 KIS 주문을 보내지 않았다고 확정하는 응답 코드 목록 (단일 원본).
// UNKNOWN(결과 불명)·DUPLICATE_REQUEST(처리 중)·5xx(장애)는 여기에 넣지 않는다.
export const ORDER_REJECTION = {
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  EXCEEDS_AVAILABLE: 'EXCEEDS_AVAILABLE',
  EXCEEDS_AVAILABLE_QTY: 'EXCEEDS_AVAILABLE_QTY',
  EXCEEDS_CHECKED_QTY: 'EXCEEDS_CHECKED_QTY',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_ORDER: 'INVALID_ORDER',
  INVALID_ORDER_CHECK: 'INVALID_ORDER_CHECK',
  MARKET_CLOSED: 'MARKET_CLOSED',
  NO_QUOTE: 'NO_QUOTE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_QUANTITY_EXCEEDED: 'ORDER_QUANTITY_EXCEEDED',
  STALE_CHECK: 'STALE_CHECK',
} as const

export const CONFIRMED_REJECTION_CODES = Object.values(ORDER_REJECTION)

export type ConfirmedRejectionCode = (typeof CONFIRMED_REJECTION_CODES)[number]

export function isConfirmedRejection(code?: string | null): boolean {
  if (!code) return false
  if (code.startsWith('INVALID_')) return true
  return (CONFIRMED_REJECTION_CODES as readonly string[]).includes(code)
}
