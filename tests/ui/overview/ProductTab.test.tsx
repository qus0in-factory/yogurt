import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { getAccountAssets, getProductBalance } from '../../../src/app/kis/account-assets-client'
import { ProductTab } from '../../../src/ui/overview/ProductTab'
import { useUiStore } from '../../../src/ui/state/ui-store'
import { balance } from './fixtures'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn() }))
vi.mock('../../../src/app/kis/account-assets-client', () => ({ getAccountAssets: vi.fn(), getProductBalance: vi.fn() }))
vi.mock('../../../src/ui/overview/IrpDetail', () => ({ IrpDetail: ({ accountId }: { accountId: string }) => <div data-testid="irp-detail">{accountId}</div> }))
const listAccounts = vi.mocked(client.listAccounts)
const base = { owner: '김철수', accountNumber: '12345678', createdAt: '2026-01-01T00:00:00.000Z' }
const assets = { rows: [
  { index: 1, purchaseAmount: 12000, evaluationAmount: 12000, profitLoss: 0, creditLoan: 0, netAssets: 12000, weight: 0 },
  { index: 9, purchaseAmount: 13000, evaluationAmount: 13000, profitLoss: 0, creditLoan: 0, netAssets: 13000, weight: 100 },
], summary: {
  totalAssets: 13000, netAssets: 13000, evaluationAmount: 12000, purchaseAmount: 10000,
  profitLoss: 2000, loanAmount: 500, deposit: 1000, totalDeposit: 1000,
  cmaEvaluation: 0, foreignEvaluation: 0,
} }
const renderTab = (productCode: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><ProductTab productCode={productCode} /></QueryClientProvider>)
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAccountAssets).mockResolvedValue(assets)
  vi.mocked(getProductBalance).mockResolvedValue(balance)
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
  it('연금저축 계좌를 선택하면 PensionDetail을 조회하고 다시 누르면 닫는다', async () => {
    listAccounts.mockResolvedValueOnce([{ ...base, id: 'pen-1', alias: '개인연금', products: ['22'] }])
    renderTab('22')
    expect(await screen.findByText('개인연금')).toBeInTheDocument()
    expect(getAccountAssets).not.toHaveBeenCalled()
    expect(getProductBalance).not.toHaveBeenCalled()
    const button = screen.getByRole('button', { name: '김철수 개인연금 12345678' })
    fireEvent.click(button)
    expect(await screen.findByRole('heading', { name: '대출현황' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '잔고 상세' })).toBeInTheDocument()
    expect(getAccountAssets).toHaveBeenCalledWith('pen-1', '22')
    expect(getProductBalance).toHaveBeenCalledWith('pen-1', '22', expect.anything())
    expect(screen.queryByTestId('irp-detail')).not.toBeInTheDocument()
    expect(useUiStore.getState().selectedProductAccountIds.pension).toBe('pen-1')
    fireEvent.click(button)
    expect(screen.queryByRole('region', { name: '잔고 상세' })).not.toBeInTheDocument()
    expect(useUiStore.getState().selectedProductAccountIds.pension).toBeNull()
  })
  it('IRP 계좌를 선택하면 기존 IrpDetail을 표시한다', async () => {
    listAccounts.mockResolvedValueOnce([{ ...base, id: 'irp-1', alias: '내IRP', products: ['29'] }])
    renderTab('29')
    expect(await screen.findByText('내IRP')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '김철수 내IRP 12345678' }))
    expect(screen.getByTestId('irp-detail')).toHaveTextContent('irp-1')
    expect(useUiStore.getState().selectedProductAccountIds.irp).toBe('irp-1')
    expect(getAccountAssets).not.toHaveBeenCalled()
    expect(getProductBalance).not.toHaveBeenCalled()
  })
})
