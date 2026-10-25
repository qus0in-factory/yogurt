import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
const summary = { cash: 1000, stockEvaluation: 12000, totalEvaluation: 13000, netAssets: 13000,
  purchaseAmount: 10000, evaluationAmount: 12000, profitLoss: 2000, assetChange: 2000, assetChangeRate: 20 }
const holding = { code: 'A', name: '삼성전자', quantity: 2, averagePrice: 5000, purchaseAmount: 10000,
  currentPrice: 6000, evaluationAmount: 12000, profitLoss: 2000, profitLossRate: 20 }
afterEach(() => { cleanup(); vi.clearAllMocks() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
}
it('shows loading while fetching', () => {
  vi.mocked(getStockBalance).mockReturnValue(new Promise(() => {}))
  show()
  expect(screen.getByText('불러오는 중…')).toBeInTheDocument()
})
it('shows summary and holdings with Korean currency formatting', async () => {
  vi.mocked(getStockBalance).mockResolvedValue({ summary, holdings: [holding] })
  show()
  expect(await screen.findByText('삼성전자')).toBeInTheDocument()
  expect(screen.getByText('13,000원')).toBeInTheDocument()
  expect(screen.getByText('1,000원')).toBeInTheDocument()
  expect(screen.getByText('12,000원')).toBeInTheDocument()
  expect(screen.getAllByText('20%')).toHaveLength(2)
})
it('shows an empty holdings state', async () => {
  vi.mocked(getStockBalance).mockResolvedValue({ summary, holdings: [] })
  show()
  expect(await screen.findByText('보유 종목이 없습니다')).toBeInTheDocument()
})
it.each([502, 404, 503])('shows unavailable for HTTP %s', async status => {
  vi.mocked(getStockBalance).mockRejectedValue({ response: { status } })
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('IRP 계좌를 조회할 수 없습니다')
})
