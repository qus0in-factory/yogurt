import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { AccountsPage } from '../../../src/ui/accounts/AccountsPage'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const listAccounts = vi.mocked(client.listAccounts)
const createAccount = vi.mocked(client.createAccount)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', productCode: '29', createdAt: '2026-01-01T00:00:00.000Z' }

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><AccountsPage /></QueryClientProvider>)
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('AccountsPage', () => {
  it('계좌가 없으면 안내 문구를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([])
    renderPage()
    expect(await screen.findByText('등록된 계좌가 없습니다')).toBeInTheDocument()
  })

  it('계좌 목록에 카드로 별칭·소유자·계좌번호와 수정 버튼을 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([account])
    renderPage()
    expect(await screen.findByText('주계좌')).toBeInTheDocument()
    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByText('김철수').compareDocumentPosition(screen.getByText('주계좌')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('12345678-29')).toBeInTheDocument()
    expect(screen.getByLabelText('계좌 목록')).toBeInTheDocument()
    const cards = screen.getAllByRole('group')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveAccessibleName('주계좌')
    expect(screen.getByRole('button', { name: '주계좌 수정' })).toBeInTheDocument()
  })

  it('추가 버튼으로 모달을 열고 저장하면 닫히고 목록이 갱신된다', async () => {
    const created = { ...account, id: 'a2', alias: '새 계좌' }
    listAccounts.mockResolvedValueOnce([]).mockResolvedValueOnce([created])
    createAccount.mockResolvedValueOnce(created)
    renderPage()
    await screen.findByText('등록된 계좌가 없습니다')
    fireEvent.click(screen.getByRole('button', { name: '계좌 추가' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '새 계좌' } })
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '김철수' } })
    fireEvent.change(screen.getByLabelText('계좌번호'), { target: { value: '11112222' } })
    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(createAccount).toHaveBeenCalled())
    expect(createAccount.mock.calls[0][0]).toEqual({ alias: '새 계좌', owner: '김철수', accountNumber: '11112222', productCode: '01', accessKey: 'AK', secretKey: 'SK' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('새 계좌')).toBeInTheDocument()
  })
})
