import { expect, it } from 'vitest'
import { filterAccounts } from '../../../src/app/accounts/filter-accounts'

const accounts = [
  { id: '1', alias: 'Main Account', owner: '김 철수', accountNumber: '12345678', products: [], createdAt: '' },
  { id: '2', alias: 'Trading', owner: '홍길동', accountNumber: '87654321', products: [], createdAt: '' },
]
it('별칭·소유자를 공백과 대소문자 무시 부분 일치로 필터링한다', () => {
  expect(filterAccounts(accounts, '  mAIN acc ')).toEqual([accounts[0]])
  expect(filterAccounts(accounts, '김철 수')).toEqual([accounts[0]])
  expect(filterAccounts(accounts, '길동')).toEqual([accounts[1]])
})
it('빈 검색어는 전체, 없는 검색어는 빈 목록이며 원본은 보존한다', () => {
  expect(filterAccounts(accounts, '  ')).toEqual(accounts)
  expect(filterAccounts(accounts, 'unknown')).toEqual([])
  expect(accounts).toHaveLength(2)
})
