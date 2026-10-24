import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { OverviewPage } from '../../../src/ui/overview/OverviewPage'
import { useUiStore } from '../../../src/ui/state/ui-store'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn() }))
const listAccounts = vi.mocked(client.listAccounts)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', createdAt: '2026-01-01T00:00:00.000Z' }

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><OverviewPage /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useUiStore.setState({ overviewTab: 'irp' })
})
afterEach(cleanup)

describe('OverviewPage', () => {
  it('IRP 탭과 패널을 표시하고 IRP 계좌만 나열한다', async () => {
    listAccounts.mockResolvedValueOnce([
      { ...account, id: 'a1', alias: 'IRP 연금', owner: '김철수', accountNumber: '12345678' },
      { ...account, id: 'a2', alias: '주계좌', owner: '박영수', accountNumber: '87654321' },
      { ...account, id: 'a3', alias: 'irp 달러', owner: '이영희', accountNumber: '11112222' },
    ])
    renderPage()
    expect(screen.getByRole('tab', { name: 'IRP' })).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel')
    expect(await screen.findByText('총 2개')).toBeInTheDocument()
    expect(within(panel).getByText('IRP 연금')).toBeInTheDocument()
    expect(within(panel).getByText('irp 달러')).toBeInTheDocument()
    expect(within(panel).getByText('김철수')).toBeInTheDocument()
    expect(within(panel).getByText('12345678')).toBeInTheDocument()
    expect(within(panel).queryByText('주계좌')).not.toBeInTheDocument()
  })

  it('IRP 계좌가 없으면 총 0개와 빈 상태를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([account])
    renderPage()
    expect(await screen.findByText('총 0개')).toBeInTheDocument()
    expect(screen.getByText('IRP 계좌가 없습니다')).toBeInTheDocument()
  })

  it('불러오는 동안 로딩 문구를 표시한다', () => {
    listAccounts.mockReturnValueOnce(new Promise<never>(() => {}))
    renderPage()
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'IRP' })).toBeInTheDocument()
  })

  it('IRP 탭 선택을 ui-store에 저장한다', () => {
    listAccounts.mockResolvedValueOnce([])
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'IRP' }))
    expect(useUiStore.getState().overviewTab).toBe('irp')
  })
})
