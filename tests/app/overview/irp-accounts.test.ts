import { describe, expect, it } from 'vitest'
import { irpAccounts } from '../../../src/app/overview/irp-accounts'

const account = (id: string, alias: string) => ({ id, alias, owner: '김철수', accountNumber: '12345678', createdAt: '2026-01-01' })

describe('irpAccounts', () => {
  it('별칭에 IRP가 포함된 계좌만 대소문자 무시하고 고른다', () => {
    const accounts = [account('1', 'IRP 연금'), account('2', '주계좌'), account('3', 'irp 달러'), account('4', 'My Irp')]
    expect(irpAccounts(accounts).map((entry) => entry.id)).toEqual(['1', '3', '4'])
  })

  it('IRP 계좌가 없으면 빈 배열을 반환한다', () => {
    expect(irpAccounts([account('1', '주계좌')])).toEqual([])
  })
})
