import { describe, expect, it } from 'vitest'
import { CONFIRMED_REJECTION_CODES, isConfirmedRejection } from '../../../../src/ui/operations/rebalance/rebalance-order-rules'

describe('CONFIRMED_REJECTION_CODES 및 isConfirmedRejection', () => {
  it('도메인 공유 상수의 확정 거부 코드 목록을 확인한다', () => {
    expect(CONFIRMED_REJECTION_CODES).toContain('ACCOUNT_NOT_FOUND')
    expect(CONFIRMED_REJECTION_CODES).toContain('MARKET_CLOSED')
    expect(CONFIRMED_REJECTION_CODES).toContain('NO_QUOTE')
    expect(CONFIRMED_REJECTION_CODES).toContain('ORDER_QUANTITY_EXCEEDED')
    expect(CONFIRMED_REJECTION_CODES).toContain('INVALID_ORDER')
  })

  it('확정 거부 코드는 true를 반환한다', () => {
    expect(isConfirmedRejection('MARKET_CLOSED')).toBe(true)
    expect(isConfirmedRejection('ORDER_QUANTITY_EXCEEDED')).toBe(true)
    expect(isConfirmedRejection('NO_QUOTE')).toBe(true)
    expect(isConfirmedRejection('ACCOUNT_NOT_FOUND')).toBe(true)
    expect(isConfirmedRejection('INVALID_CUSTOM_REASON')).toBe(true)
  })

  it('409, 5xx, 202, UNKNOWN 등 미확정/장애 코드는 false를 반환한다', () => {
    expect(isConfirmedRejection('ORDER_IN_PROGRESS')).toBe(false)
    expect(isConfirmedRejection('ORDER_FAILED')).toBe(false)
    expect(isConfirmedRejection('ORDER_UNAVAILABLE')).toBe(false)
    expect(isConfirmedRejection('ORDER_UNKNOWN')).toBe(false)
    expect(isConfirmedRejection('UNKNOWN')).toBe(false)
    expect(isConfirmedRejection(undefined)).toBe(false)
    expect(isConfirmedRejection(null)).toBe(false)
  })
})
