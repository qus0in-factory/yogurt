import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { EditAccountDialog } from '../../../src/ui/accounts/EditAccountDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn() }))
vi.mock('../../../src/app/accounts/credentials-client', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../src/app/accounts/credentials-client')>(), replaceCredentials: vi.fn(),
}))
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }
beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('Key 교체 화면', () => {
  it('교체 화면으로 전환하고 뒤로 가면 입력값을 폐기한다', () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><EditAccountDialog account={account} onClose={vi.fn()} /></QueryClientProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Access/Secret Key 교체' }))
    expect(screen.getByRole('heading', { name: 'Key 교체' })).toBeInTheDocument()
    expect(screen.getByText('기존 키는 표시되지 않습니다. 새 키를 입력하세요.')).toBeInTheDocument()
    const access = screen.getByLabelText('Access Key')
    expect(access).toHaveValue('')
    expect(access).toHaveAttribute('type', 'password')
    fireEvent.change(access, { target: { value: 'AK' } })
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.getByRole('heading', { name: '계좌 수정' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Access/Secret Key 교체' }))
    expect(screen.getByLabelText('Access Key')).toHaveValue('')
  })
})
