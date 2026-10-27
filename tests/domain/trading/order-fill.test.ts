import { describe, expect, it } from 'vitest'
import { classifyFill, NOT_FOUND_FILL, RATE_LIMITED_FILL, type FillQuery, type FillStatus } from '../../../src/domain/trading/order-fill'

describe('체결 상태 분류', () => {
  it.each<[string, FillQuery | null, FillStatus]>([
    ['미발견 신호는 not_found다', NOT_FOUND_FILL, 'not_found'],
    ['일시 제한 신호는 rate_limited다', RATE_LIMITED_FILL, 'rate_limited'],
    ['조회 실패는 unknown이다', null, 'unknown'],
    ['전량 체결이면 filled', { orderedQty: 10, filledQty: 10, remainingQty: 0, cancelled: false }, 'filled'],
    ['일부 체결이면 partial', { orderedQty: 10, filledQty: 4, remainingQty: 6, cancelled: false }, 'partial'],
    ['미체결이면 open', { orderedQty: 10, filledQty: 0, remainingQty: 10, cancelled: false }, 'open'],
    ['체결 4·잔량 0·미취소는 closed_partial', { orderedQty: 10, filledQty: 4, remainingQty: 0, cancelled: false }, 'closed_partial'],
    ['체결 4·잔량 0·취소도 closed_partial', { orderedQty: 10, filledQty: 4, remainingQty: 0, cancelled: true }, 'closed_partial'],
    ['체결 0·잔량 0은 cancelled', { orderedQty: 10, filledQty: 0, remainingQty: 0, cancelled: false }, 'cancelled'],
  ])('%s', (_name, input, expected) => {
    expect(classifyFill(input)).toBe(expected)
  })
})
