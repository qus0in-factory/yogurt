import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { AddAccountDialog } from '../../../src/ui/accounts/AddAccountDialog'
import { EditAccountDialog } from '../../../src/ui/accounts/EditAccountDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const listAccounts = vi.mocked(client.listAccounts)
const base = { alias: '주계좌', accountNumber: '12345678', products: [], createdAt: '2026-01-01T00:00:00.000Z' }
const accounts = [
  { ...base, id: '1', owner: '김철수' },
  { ...base, id: '2', owner: '김철수' },
  { ...base, id: '3', owner: '이영희' },
]

const wrap = (node: React.ReactNode) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>)
}

const expectOwnerList = async () => {
  const input = screen.getByLabelText('소유자')
  expect(input).toHaveAttribute('autocomplete', 'off')
  const datalist = document.getElementById(input.getAttribute('list')!)
  expect(datalist?.tagName).toBe('DATALIST')
  await waitFor(() => expect(datalist?.querySelectorAll('option')).toHaveLength(2))
  expect(Array.from(datalist!.querySelectorAll('option')).map((option) => option.getAttribute('value'))).toEqual(['김철수', '이영희'])
}

beforeEach(() => {
  vi.clearAllMocks()
  listAccounts.mockResolvedValue(accounts)
})
afterEach(cleanup)

describe('소유자 자동완성', () => {
  it('추가 모달은 기존 소유자를 중복 없이 datalist로 제공한다', async () => {
    wrap(<AddAccountDialog open onClose={vi.fn()} />)
    await expectOwnerList()
  })

  it('수정 모달도 기존 소유자 datalist를 입력에 연결한다', async () => {
    wrap(<EditAccountDialog account={accounts[0]} onClose={vi.fn()} />)
    await expectOwnerList()
  })
})
