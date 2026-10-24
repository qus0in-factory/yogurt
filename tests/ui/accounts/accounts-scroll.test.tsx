import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { useUiStore } from '../../../src/ui/state/ui-store'
import { AccountsPage } from '../../../src/ui/accounts/AccountsPage'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn() }))
const accounts = [
  { id: '1', alias: '주계좌', owner: '김철수', accountNumber: '1234', createdAt: '' },
  { id: '2', alias: '보조계좌', owner: '홍길동', accountNumber: '5678', createdAt: '' },
]
const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AccountsPage /></QueryClientProvider>)
beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
  vi.mocked(client.listAccounts).mockResolvedValue(accounts)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('전체 수와 저장된 page를 복원한다', async () => {
  sessionStorage.setItem('yogurt:accounts-page', '1')
  renderPage()
  expect(await screen.findByText('총 2개')).toBeInTheDocument()
  expect(screen.getByText('2 / 2')).toBeInTheDocument()
  expect(useUiStore.getState().selectedAccountId).toBe('2')
})

it('검색어를 복원하고 변경 시 page를 0으로 저장한다', async () => {
  sessionStorage.setItem('yogurt:accounts-query', JSON.stringify('김 철수'))
  renderPage()
  expect(await screen.findByText('검색 결과 1개 / 총 2개')).toBeInTheDocument()
  const search = screen.getByRole('searchbox', { name: '별칭 또는 소유자 검색' })
  expect(search).toHaveValue('김 철수')
  fireEvent.change(search, { target: { value: '보조' } })
  expect(screen.getByRole('group', { name: '보조계좌' })).toBeInTheDocument()
  await waitFor(() => expect(sessionStorage.getItem('yogurt:accounts-page')).toBe('0'))
  expect(sessionStorage.getItem('yogurt:accounts-query')).toBe(JSON.stringify('보조'))
  fireEvent.change(search, { target: { value: '없는 계좌' } })
  expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }))
  expect(search).toHaveValue('')
  expect(screen.getByText('1 / 2')).toBeInTheDocument()
})
