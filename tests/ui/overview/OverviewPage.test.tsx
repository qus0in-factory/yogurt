import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { OverviewPage } from '../../../src/ui/overview/OverviewPage'
import { useUiStore } from '../../../src/ui/state/ui-store'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn() }))
const listAccounts = vi.mocked(client.listAccounts)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: [], createdAt: '2026-01-01T00:00:00.000Z' }

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><OverviewPage /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useUiStore.setState({ overviewTab: 'irp', selectedProductAccountIds: {} })
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('OverviewPage', () => {
  it('IRP와 연금저축 탭 그룹을 표시하고 탭 전환 시 overviewTab과 패널을 바꾼다', async () => {
    listAccounts.mockResolvedValue([
      { ...account, id: 'a1', alias: 'IRP 계좌', products: ['29'] },
      { ...account, id: 'a2', alias: '연금저축 계좌', products: ['22'] },
    ])
    renderPage()
    const irpTab = screen.getByRole('tab', { name: 'IRP' })
    const pensionTab = screen.getByRole('tab', { name: '연금저축' })
    expect(irpTab).toHaveAttribute('aria-selected', 'true')
    expect(irpTab).toHaveClass('bg-white', 'shadow-sm', 'text-stone-900')
    expect(pensionTab).toHaveAttribute('aria-selected', 'false')
    expect(pensionTab).toHaveClass('text-stone-500')
    expect(await screen.findByText('IRP 계좌')).toBeInTheDocument()

    fireEvent.click(pensionTab)
    expect(useUiStore.getState().overviewTab).toBe('pension')
    expect(pensionTab).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('연금저축 계좌')).toBeInTheDocument()
  })

  it('계좌가 없으면 해당 상품 빈 상태를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([account])
    renderPage()
    expect(await screen.findByText('총 0개')).toBeInTheDocument()
    expect(screen.getByText('IRP 계좌가 없습니다')).toBeInTheDocument()
  })

  it('로딩 중 로딩 문구를 표시한다', () => {
    listAccounts.mockReturnValueOnce(new Promise<never>(() => {}))
    renderPage()
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument()
  })
})
