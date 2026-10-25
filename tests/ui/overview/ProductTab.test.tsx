import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { ProductTab } from '../../../src/ui/overview/ProductTab'
import { useUiStore } from '../../../src/ui/state/ui-store'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn() }))
vi.mock('../../../src/ui/overview/IrpDetail', () => ({ IrpDetail: ({ accountId }: { accountId: string }) => <div data-testid="irp-detail">{accountId}</div> }))
const listAccounts = vi.mocked(client.listAccounts)
const base = { owner: '김철수', accountNumber: '12345678', createdAt: '2026-01-01T00:00:00.000Z' }

const renderTab = (productCode: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><ProductTab productCode={productCode} /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useUiStore.setState({ selectedProductAccountIds: {}, overviewTab: 'irp' })
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('ProductTab', () => {
  it('연금저축 탭에서 빈 상태는 연금저축 문구를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([])
    renderTab('22')
    expect(await screen.findByText('연금저축 계좌가 없습니다')).toBeInTheDocument()
  })

  it('연금저축 계좌를 선택하면 상세 준비 중 안내를 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([{ ...base, id: 'pen-1', alias: '개인연금', products: ['22'] }])
    renderTab('22')
    expect(await screen.findByText('개인연금')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '김철수 개인연금 12345678' }))
    expect(screen.getByText('연금저축 상세는 준비 중')).toBeInTheDocument()
    expect(useUiStore.getState().selectedProductAccountIds.pension).toBe('pen-1')
  })

  it('IRP 계좌를 선택하면 IrpDetail을 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([{ ...base, id: 'irp-1', alias: '내IRP', products: ['29'] }])
    renderTab('29')
    expect(await screen.findByText('내IRP')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '김철수 내IRP 12345678' }))
    expect(screen.getByTestId('irp-detail')).toHaveTextContent('irp-1')
    expect(useUiStore.getState().selectedProductAccountIds.irp).toBe('irp-1')
  })
})
