import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { OverviewPage } from '../../../src/ui/overview/OverviewPage'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn() }))
const listAccounts = vi.mocked(client.listAccounts)

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><OverviewPage /></QueryClientProvider>)
}

const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', createdAt: '2026-01-01T00:00:00.000Z' }

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('OverviewPage', () => {
  it('제목과 등록된 계좌 총 개수를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([account, { ...account, id: 'a2' }])
    renderPage()
    expect(screen.getByRole('heading', { name: '현황' })).toBeInTheDocument()
    expect(await screen.findByText('등록된 계좌 2개')).toBeInTheDocument()
  })

  it('계좌가 없으면 0개를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([])
    renderPage()
    expect(await screen.findByText('등록된 계좌 0개')).toBeInTheDocument()
  })

  it('불러오는 동안 로딩 문구를 표시한다', () => {
    listAccounts.mockReturnValueOnce(new Promise<never>(() => {}))
    renderPage()
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument()
  })
})
