import { describe, expect, it } from 'vitest'
import { irpAccounts } from '../../../src/app/overview/irp-accounts'
import type { Account } from '../../../src/domain/accounts/account'

const account = (id: string, alias: string, products: string[]): Account => ({
  id,
  alias,
  owner: '김철수',
  accountNumber: '12345678',
  products,
  createdAt: '2026-01-01',
})

describe('irpAccounts', () => {
  it('IRP 상품이 활성화된 계좌만 별칭과 무관하게 고른다', () => {
    const accounts = [
      account('1', '연금', ['29']),
      account('2', 'IRP 주계좌', ['01']),
      account('3', 'IRP 달러', ['22']),
      account('4', 'My IRP', ['29']),
    ]
    expect(irpAccounts(accounts).map((entry) => entry.id)).toEqual(['1', '4'])
  })

  it('IRP 상품이 활성화된 계좌가 없으면 빈 배열을 반환한다', () => {
    expect(irpAccounts([account('1', 'IRP 주계좌', ['01'])])).toEqual([])
  })
})
