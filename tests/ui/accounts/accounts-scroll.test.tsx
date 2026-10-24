import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { useUiStore } from '../../../src/ui/state/ui-store'
import { AccountsPage } from '../../../src/ui/accounts/AccountsPage'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn() }))

const listAccounts = vi.mocked(client.listAccounts)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '123-456-789', createdAt: '2026-01-01T00:00:00.000Z' }

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><AccountsPage /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  localStorage.clear()
  useUiStore.setState({ selectedAccountId: null })
})
afterEach(cleanup)

describe('계좌 카드 탭 상태', () => {
  it('스크롤 위치를 sessionStorage에 저장한다', async () => {
    const getSpy = vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockReturnValue(120)
    listAccounts.mockResolvedValueOnce([account])
    renderPage()
    await screen.findByText('주계좌')
    fireEvent.scroll(screen.getByLabelText('계좌 목록'))
    await waitFor(() => expect(sessionStorage.getItem('yogurt:accounts-scroll')).toBe('120'), { timeout: 500 })
    getSpy.mockRestore()
  })

  it('마운트 시 저장된 스크롤 위치를 복원한다', async () => {
    sessionStorage.setItem('yogurt:accounts-scroll', '80')
    const setSpy = vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'set').mockImplementation(() => {})
    listAccounts.mockResolvedValueOnce([account])
    renderPage()
    await screen.findByText('주계좌')
    await waitFor(() => expect(setSpy).toHaveBeenCalledWith(80))
    setSpy.mockRestore()
  })

  it('카드 클릭 시 선택한 계좌를 ui-store에 기록한다', async () => {
    listAccounts.mockResolvedValueOnce([account])
    renderPage()
    fireEvent.click(await screen.findByText('주계좌'))
    await waitFor(() => expect(useUiStore.getState().selectedAccountId).toBe('a1'))
  })
})
