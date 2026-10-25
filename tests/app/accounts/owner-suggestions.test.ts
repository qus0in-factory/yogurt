import { describe, expect, it } from 'vitest'
import { ownerSuggestions } from '../../../src/app/accounts/owner-suggestions'
import type { Account } from '../../../src/domain/accounts/account'

const accounts: Account[] = [
  { id: '1', alias: 'A', owner: '  홍길동 ', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: '2', alias: 'B', owner: '김철수', accountNumber: '87654321', products: [], productPlans: {}, createdAt: '2026-01-03T00:00:00.000Z' },
  { id: '3', alias: 'C', owner: '홍길동', accountNumber: '11112222', products: [], productPlans: {}, createdAt: '2026-01-02T00:00:00.000Z' },
  { id: '4', alias: 'D', owner: '   ', accountNumber: '33334444', products: [], productPlans: {}, createdAt: '2026-01-04T00:00:00.000Z' },
]

describe('ownerSuggestions', () => {
  it('중복을 제거하고 최근 등록 순으로 반환한다', () => {
    expect(ownerSuggestions(accounts)).toEqual(['김철수', '홍길동'])
  })

  it('공백 owner는 제외한다', () => {
    expect(ownerSuggestions(accounts)).not.toContain('')
  })

  it('빈 목록은 빈 배열을 반환한다', () => {
    expect(ownerSuggestions([])).toEqual([])
  })
})
