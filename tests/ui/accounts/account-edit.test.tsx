import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { toast } from 'sonner'
import { AccountsPage } from '../../../src/ui/accounts/AccountsPage'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const listAccounts = vi.mocked(client.listAccounts)
const updateAccount = vi.mocked(client.updateAccount)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: [], createdAt: '2026-01-01T00:00:00.000Z' }

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><AccountsPage /></QueryClientProvider>)
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('계좌 수정', () => {
  it('카드의 수정 버튼으로 별칭과 소유자를 바꾸면 목록이 갱신된다', async () => {
    const updated = { ...account, alias: '연금', owner: '이영희' }
    listAccounts.mockResolvedValueOnce([account]).mockResolvedValueOnce([updated]).mockResolvedValueOnce([updated])
    updateAccount.mockResolvedValueOnce(updated)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '주계좌 수정' }))
    expect(screen.getByLabelText('별칭')).toHaveValue('주계좌')
    expect(screen.getByLabelText('소유자')).toHaveValue('김철수')
    expect(within(screen.getByRole('dialog')).getByText('12345678')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '연금' } })
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '이영희' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(updateAccount).toHaveBeenCalledWith('a1', { alias: '연금', owner: '이영희' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('연금')).toBeInTheDocument()
    expect(screen.getByText('이영희')).toBeInTheDocument()
    expect(listAccounts).toHaveBeenCalledTimes(3)
    expect(toast).toHaveBeenCalledWith('계좌를 수정했습니다')
  })
})
