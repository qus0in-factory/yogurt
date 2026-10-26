import { describe, expect, it } from 'vitest'
import { daysUntil, isaExpiry, isaK, isaStatus, isaTerm, isaYear, safeIsaExpiry } from '../../../src/app/accounts/isa-term'

describe('isaExpiry', () => {
  it('시작일로부터 정확히 3년 후를 반환한다', () => {
    expect(isaExpiry('2024-03-15')).toBe('2027-03-15')
  })

  it('윤일 시작은 2월 말로 보정한다', () => {
    expect(isaExpiry('2024-02-29')).toBe('2027-02-28')
    expect(isaExpiry('2028-02-29')).toBe('2031-02-28')
  })

  it('실존하지 않는 날짜는 null로 돌려준다', () => {
    expect(safeIsaExpiry('2024-03-15')).toBe('2027-03-15')
    expect(safeIsaExpiry('2024-02-30')).toBeNull()
  })
})

describe('isaK', () => {
  it('B: 시작 월 k=1, 만기 월 k=36, 36 초과 금지, 시작 이전 k=0', () => {
    expect(isaK('2026-01-15', '2025-12-01')).toBe(0) // 시작 이전
    expect(isaK('2026-01-15', '2026-01-01')).toBe(1) // 시작 월 k=1
    expect(isaK('2026-01-15', '2026-02-01')).toBe(2)
    expect(isaK('2026-01-15', '2029-01-15')).toBe(36) // 만기 월 k=36
    expect(isaK('2026-01-15', '2029-02-01')).toBe(36) // 36 초과 금지
    expect(isaK('2026-01-15', '2035-01-01')).toBe(36) // 36 초과 금지
  })
})

describe('daysUntil', () => {
  it('서울 날짜 기준 남은 일수를 센다', () => {
    expect(daysUntil('2027-03-15', '2027-03-01')).toBe(14)
    expect(daysUntil('2027-03-15', '2027-03-15')).toBe(0)
    expect(daysUntil('2027-03-15', '2027-03-16')).toBe(-1)
  })
})

describe('isaStatus', () => {
  it.each([
    [91, 'active'],
    [90, 'expiringSoon'],
    [0, 'expiringSoon'],
    [-1, 'expired'],
  ] as const)('%i일 남으면 %s', (daysLeft, status) => {
    expect(isaStatus(daysLeft)).toBe(status)
  })
})

describe('isaTerm', () => {
  it('만료일·남은 일수·상태를 함께 계산한다', () => {
    expect(isaTerm('2024-03-15', '2027-03-01')).toEqual({ expiry: '2027-03-15', daysLeft: 14, status: 'expiringSoon' })
  })
})

describe('isaYear', () => {
  it('시작 월부터 12개월 단위로 1년차·2년차·3년차를 계산한다', () => {
    // k=1 (2024-03) -> 1
    expect(isaYear('2024-03-15', '2024-03-15')).toBe(1)
    // k=12 (2025-02) -> 1
    expect(isaYear('2024-03-15', '2025-02-28')).toBe(1)
    // k=13 (2025-03) -> 2
    expect(isaYear('2024-03-15', '2025-03-01')).toBe(2)
    // k=25 (2026-03) -> 3
    expect(isaYear('2024-03-15', '2026-03-01')).toBe(3)
  })

  it('시작 이전이면 beforeStart 를 반환한다', () => {
    expect(isaYear('2024-03-15', '2024-02-15')).toBe('beforeStart')
  })

  it('만기가 지나 expired 상태이면 null 을 반환한다', () => {
    // 2024-03-15 만기는 2027-03-15, 2027-03-16은 만기 경과 (expired)
    expect(isaYear('2024-03-15', '2027-03-16')).toBeNull()
  })
})
