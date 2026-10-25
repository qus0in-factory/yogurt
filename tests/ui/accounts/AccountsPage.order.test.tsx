import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { listAccounts, reorderAccounts } from '../../../src/app/accounts/client'
import { AccountsPage } from '../../../src/ui/accounts/AccountsPage'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn(), reorderAccounts: vi.fn() }))
vi.mock('../../../src/ui/accounts/useKisStatus', () => ({ useKisStatus: () => new Map() }))
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '' }
const second = { ...account, id: 'a2', alias: '보조계좌' }
const show = () => render(<QueryClientProvider client={new QueryClient()}><AccountsPage /></QueryClientProvider>)
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear() })
afterEach(cleanup)

it('검색 중에는 순서 편집을 비활성화한다', async () => {
  vi.mocked(listAccounts).mockResolvedValueOnce([account])
  show()
  await screen.findByText('주계좌')
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '주' } })
  expect(screen.getByRole('button', { name: '순서 편집' })).toBeDisabled()
})

it('키보드로 순서를 바꿔 완료하면 바뀐 id 순서를 저장한다', async () => {
  vi.mocked(listAccounts).mockResolvedValueOnce([account, second])
  vi.mocked(reorderAccounts).mockResolvedValueOnce([second, account])
  show()
  await screen.findByText('주계좌')
  fireEvent.click(screen.getByRole('button', { name: '순서 편집' }))
  const handle = screen.getByRole('button', { name: '주계좌 순서 이동' })
  handle.focus()
  fireEvent.keyDown(handle, { key: ' ', code: 'Space' })
  fireEvent.keyDown(handle, { key: 'ArrowDown', code: 'ArrowDown' })
  fireEvent.keyDown(handle, { key: ' ', code: 'Space' })
  fireEvent.click(screen.getByRole('button', { name: '완료' }))
  await waitFor(() => expect(reorderAccounts).toHaveBeenCalledWith(['a2', 'a1']))
})

it('취소는 저장하지 않고 편집 모드를 닫는다', async () => {
  vi.mocked(listAccounts).mockResolvedValueOnce([account, second])
  show()
  await screen.findByText('주계좌')
  fireEvent.click(screen.getByRole('button', { name: '순서 편집' }))
  fireEvent.click(screen.getByRole('button', { name: '취소' }))
  expect(reorderAccounts).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: '순서 편집' })).toBeEnabled()
})
