import { describe, expect, it } from 'vitest'
import { productAccounts } from '../../../src/app/overview/product-accounts'
import type { Account } from '../../../src/domain/accounts/account'

const account = (id: string, alias: string, products: string[]): Account => ({
  id,
  alias,
  owner: '김철수',
  accountNumber: '12345678',
  products,
  createdAt: '2026-01-01',
})

describe('productAccounts', () => {
  it('주어진 상품코드가 활성화된 계좌만 고른다', () => {
    const accounts = [
      account('1', '연금', ['29']),
      account('2', 'IRP 주계좌', ['01']),
      account('3', 'IRP 달러', ['22']),
      account('4', 'My IRP', ['29', '22']),
    ]
    expect(productAccounts(accounts, '29').map((entry) => entry.id)).toEqual(['1', '4'])
    expect(productAccounts(accounts, '22').map((entry) => entry.id)).toEqual(['3', '4'])
  })

  it('해당 상품이 활성화된 계좌가 없으면 빈 배열을 반환한다', () => {
    expect(productAccounts([account('1', '주계좌', ['01'])], '29')).toEqual([])
  })
})
